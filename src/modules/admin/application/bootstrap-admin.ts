import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { TOTP } from "otpauth";
import { withTransaction } from "../../../lib/database/transaction.ts";
import {
  hashPassword,
  encryptMfaSecret,
  newRecoveryCodes,
  normalizeRecovery,
  tokenHash,
} from "../../../lib/auth/crypto.ts";
import { admins, adminRoles } from "../../../db/schema/admin.ts";
import { adminEventScopes } from "../../../db/schema/operations.ts";
import { appendAudit } from "../../../lib/logging/audit.ts";
import { roles } from "../domain/permissions.ts";
const inputSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.trim().toLowerCase()),
  password: z.string().min(14).max(1024),
  secret: z.string().regex(/^[A-Z2-7]{16,128}$/),
  code: z.string(),
  roles: z.array(z.enum(roles)).min(1),
  eventScopes: z.array(z.uuid()),
});
export async function bootstrapAdmin(input: {
  email: string;
  password: string;
  secret: string;
  code: string;
  roles: string[];
  eventScopes: string[];
}): Promise<{ id: string; recoveryCodes: string[] }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Geçersiz admin kurulum girdisi");
  const data = parsed.data;
  const timestamp = Date.now(),
    delta = new TOTP({ secret: data.secret }).validate({
      token: data.code,
      timestamp,
      window: 1,
    });
  if (delta === null) throw new Error("MFA doğrulanamadı");
  const id = randomUUID(),
    passwordHash = await hashPassword(data.password),
    recoveryCodes = newRecoveryCodes();
  await withTransaction(async (tx) => {
    await tx
      .insert(admins)
      .values({
        id,
        email: data.email,
        passwordHash,
        mfaSecretEncrypted: encryptMfaSecret(data.secret, id),
        lastTotpCounter: Math.floor(timestamp / 30_000) + delta,
        recoveryCodeHashes: recoveryCodes.map((c) =>
          tokenHash(normalizeRecovery(c)),
        ),
      });
    await tx
      .insert(adminRoles)
      .values([...new Set(data.roles)].map((role) => ({ adminId: id, role })));
    if (data.eventScopes.length)
      await tx
        .insert(adminEventScopes)
        .values(
          [...new Set(data.eventScopes)].map((eventId) => ({
            adminId: id,
            eventId,
          })),
        );
    await appendAudit(
      tx,
      { adminId: id, roles: data.roles, eventScopes: data.eventScopes },
      "admin.created",
      { type: "admin", id },
      { changedFields: ["roles", "eventScopes"] },
    );
  });
  return { id, recoveryCodes };
}
