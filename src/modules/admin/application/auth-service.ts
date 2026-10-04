import "server-only";
import { TOTP } from "otpauth";
import { withTransaction } from "../../../lib/database/transaction.ts";
import {
  hashPassword,
  verifyPassword,
  decryptMfaSecret,
  tokenHash,
  normalizeRecovery,
  equal,
} from "../../../lib/auth/crypto.ts";
import { createSession, type AdminSession } from "../../../lib/auth/session.ts";
import { appendAudit } from "../../../lib/logging/audit.ts";
import {
  lockAdmin,
  updateAdmin,
  actorFor,
} from "../infrastructure/admin-repository.ts";
import { PANEL_ADMIN_EMAIL } from "../domain/panel-account.ts";
let dummyHash: Promise<string> | undefined;
export async function authenticatePanelPassword(
  password: string,
): Promise<AdminSession> {
  const session = await withTransaction(async (tx) => {
    const admin = await lockAdmin(tx, PANEL_ADMIN_EMAIL);
    const encoded =
      admin?.passwordHash ??
      (await (dummyHash ??= hashPassword("Dummy-password-no-admin-identity")));
    const passwordOk = await verifyPassword(encoded, password);
    if (
      !admin ||
      admin.disabledAt ||
      (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now())
    )
      return null;
    if (!passwordOk) {
      const attempts =
        admin.lockedUntil && admin.lockedUntil.getTime() <= Date.now()
          ? 1
          : admin.failedAttempts + 1;
      await updateAdmin(tx, admin.id, {
        failedAttempts: attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
      });
      await appendAudit(
        tx,
        await actorFor(tx, admin.id),
        "admin.login_failed",
        { type: "admin", id: admin.id },
        {},
      );
      return null;
    }
    await updateAdmin(tx, admin.id, { failedAttempts: 0, lockedUntil: null });
    const next = await createSession(tx, admin.id);
    await appendAudit(
      tx,
      next.actor,
      "admin.logged_in",
      { type: "admin", id: admin.id },
      {},
    );
    return next;
  });
  if (!session) throw new Error("Giriş bilgileri doğrulanamadı");
  return session;
}
export async function authenticateAdmin(
  email: string,
  password: string,
  mfaCode: string,
): Promise<AdminSession> {
  const session = await withTransaction(async (tx) => {
    const admin = await lockAdmin(tx, email.trim().toLowerCase());
    const encoded =
      admin?.passwordHash ??
      (await (dummyHash ??= hashPassword("Dummy-password-no-admin-identity")));
    const passwordOk = await verifyPassword(encoded, password);
    if (
      !admin ||
      admin.disabledAt ||
      (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now())
    )
      return null;
    let mfaOk = false,
      counter = admin.lastTotpCounter,
      recovery = admin.recoveryCodeHashes;
    if (passwordOk && admin.mfaSecretEncrypted) {
      if (/^\d{6}$/.test(mfaCode)) {
        const timestamp = Date.now();
        try {
          const delta = new TOTP({
            secret: decryptMfaSecret(admin.mfaSecretEncrypted, admin.id),
          }).validate({ token: mfaCode, timestamp, window: 1 });
          const step = Math.floor(timestamp / 30_000) + (delta ?? 0);
          if (delta !== null && (counter === null || step > counter)) {
            mfaOk = true;
            counter = step;
          }
        } catch {
          mfaOk = false;
        }
      } else {
        const normalized = normalizeRecovery(mfaCode);
        if (/^[a-f0-9]{32}$/.test(normalized)) {
          const digest = tokenHash(normalized);
          const found = recovery.findIndex((h) => equal(h, digest));
          if (found >= 0) {
            mfaOk = true;
            recovery = recovery.filter((_, i) => i !== found);
          }
        }
      }
    }
    if (!passwordOk || !mfaOk) {
      const attempts =
        admin.lockedUntil && admin.lockedUntil.getTime() <= Date.now()
          ? 1
          : admin.failedAttempts + 1;
      await updateAdmin(tx, admin.id, {
        failedAttempts: attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
      });
      await appendAudit(
        tx,
        await actorFor(tx, admin.id),
        "admin.login_failed",
        { type: "admin", id: admin.id },
        {},
      );
      return null;
    }
    await updateAdmin(tx, admin.id, {
      failedAttempts: 0,
      lockedUntil: null,
      lastTotpCounter: counter,
      recoveryCodeHashes: recovery,
    });
    const next = await createSession(tx, admin.id);
    await appendAudit(
      tx,
      next.actor,
      "admin.logged_in",
      { type: "admin", id: admin.id },
      {},
    );
    return next;
  });
  if (!session) throw new Error("Giriş bilgileri doğrulanamadı");
  return session;
}
