import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { hashPassword } from "../../../lib/auth/crypto.ts";
import { appendAudit } from "../../../lib/logging/audit.ts";
import { admins, adminRoles, adminSessions } from "../../../db/schema/admin.ts";
import { PANEL_ADMIN_EMAIL } from "../domain/panel-account.ts";
import { actorFor, lockAdmin } from "../infrastructure/admin-repository.ts";

export async function setPanelPassword(password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await withTransaction(async (tx) => {
    const current = await lockAdmin(tx, PANEL_ADMIN_EMAIL);
    const adminId = current?.id ?? randomUUID();
    if (current) {
      await tx
        .update(admins)
        .set({
          passwordHash,
          mfaSecretEncrypted: null,
          recoveryCodeHashes: [],
          lastTotpCounter: null,
          disabledAt: null,
          failedAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(admins.id, adminId));
    } else {
      await tx.insert(admins).values({
        id: adminId,
        email: PANEL_ADMIN_EMAIL,
        passwordHash,
      });
    }
    for (const role of ["content_editor", "event_manager", "system_admin"])
      await tx
        .insert(adminRoles)
        .values({ adminId, role })
        .onConflictDoNothing();
    await tx
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(
        sql`${adminSessions.adminId}=${adminId} and ${adminSessions.revokedAt} is null`,
      );
    await appendAudit(
      tx,
      await actorFor(tx, adminId),
      current ? "admin.password_changed" : "admin.created",
      { type: "admin", id: adminId },
      current ? {} : { changedFields: ["roles"] },
    );
  });
}
