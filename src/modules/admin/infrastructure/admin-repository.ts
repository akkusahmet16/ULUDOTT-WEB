import "server-only";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { admins, adminRoles, adminSessions } from "../../../db/schema/admin.ts";
import { adminEventScopes, rateLimits } from "../../../db/schema/operations.ts";
export async function lockAdmin(tx: DbTx, email: string) {
  return (
    await tx.select().from(admins).where(eq(admins.email, email)).for("update")
  )[0];
}
export async function actorFor(tx: DbTx, id: string) {
  const roles = await tx
    .select({ role: adminRoles.role })
    .from(adminRoles)
    .where(eq(adminRoles.adminId, id));
  const scopes = await tx
    .select({ id: adminEventScopes.eventId })
    .from(adminEventScopes)
    .where(eq(adminEventScopes.adminId, id));
  return {
    adminId: id,
    roles: roles.map((r) => r.role),
    eventScopes: scopes.map((s) => s.id),
  };
}
export async function updateAdmin(
  tx: DbTx,
  id: string,
  data: Partial<typeof admins.$inferInsert>,
) {
  await tx.update(admins).set(data).where(eq(admins.id, id));
}
export async function insertSession(
  tx: DbTx,
  data: typeof adminSessions.$inferInsert,
) {
  return (await tx.insert(adminSessions).values(data).returning())[0];
}
export async function sessionRecord(tx: DbTx, hash: string, lock = false) {
  const q = tx
    .select({ session: adminSessions, disabledAt: admins.disabledAt })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(
      and(eq(adminSessions.tokenHash, hash), isNull(adminSessions.revokedAt)),
    );
  return (lock ? await q.for("update", { of: adminSessions }) : await q)[0];
}
export async function revokeSessionRecord(tx: DbTx, id: string) {
  return (
    await tx
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.id, id), isNull(adminSessions.revokedAt)))
      .returning()
  )[0];
}
export async function loginRateAllowed(tx: DbTx) {
  const start = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  const [r] = await tx
    .insert(rateLimits)
    .values({
      scope: "admin_login_global",
      keyHash: "global",
      windowStartsAt: start,
      count: 1,
      expiresAt: new Date(start.getTime() + 120_000),
    })
    .onConflictDoUpdate({
      target: [rateLimits.scope, rateLimits.keyHash, rateLimits.windowStartsAt],
      set: { count: sql`${rateLimits.count}+1` },
    })
    .returning({ count: rateLimits.count });
  return r.count <= 120;
}
