import "server-only";
import { withTransaction, type DbTx } from "../database/transaction.ts";
import {
  actorFor,
  insertSession,
  sessionRecord,
  revokeSessionRecord,
} from "../../modules/admin/infrastructure/admin-repository.ts";
import { randomToken, tokenHash } from "./crypto.ts";
import { appendAudit, type Actor } from "../logging/audit.ts";
export const SESSION_COOKIE = "__Host-uludott_admin";
export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};
export type AdminSession = {
  id: string;
  token: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  actor: Actor;
};
export async function createSession(
  tx: DbTx,
  adminId: string,
  absoluteExpiresAt = new Date(Date.now() + 8 * 60 * 60_000),
): Promise<AdminSession> {
  const token = randomToken();
  const expiresAt = new Date(
    Math.min(Date.now() + 30 * 60_000, absoluteExpiresAt.getTime()),
  );
  const row = await insertSession(tx, {
    adminId,
    tokenHash: tokenHash(token),
    expiresAt,
    absoluteExpiresAt,
  });
  return {
    id: row.id,
    token,
    expiresAt,
    absoluteExpiresAt,
    actor: await actorFor(tx, adminId),
  };
}
function valid(row: Awaited<ReturnType<typeof sessionRecord>> | undefined) {
  return (
    row &&
    !row.disabledAt &&
    row.session.expiresAt.getTime() > Date.now() &&
    row.session.absoluteExpiresAt.getTime() > Date.now()
  );
}
export async function resolveSession(
  token: string,
): Promise<Omit<AdminSession, "token"> | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return withTransaction(async (tx) => {
    const row = await sessionRecord(tx, tokenHash(token));
    if (!valid(row) || !row) return null;
    return {
      id: row.session.id,
      expiresAt: row.session.expiresAt,
      absoluteExpiresAt: row.session.absoluteExpiresAt,
      actor: await actorFor(tx, row.session.adminId),
    };
  });
}
export async function renewSession(token: string): Promise<AdminSession> {
  return withTransaction(async (tx) => {
    const row = /^[A-Za-z0-9_-]{43}$/.test(token)
      ? await sessionRecord(tx, tokenHash(token), true)
      : undefined;
    if (!valid(row) || !row) throw new Error("Oturum geçersiz");
    await revokeSessionRecord(tx, row.session.id);
    const next = await createSession(
      tx,
      row.session.adminId,
      row.session.absoluteExpiresAt,
    );
    await appendAudit(
      tx,
      next.actor,
      "admin.session_renewed",
      { type: "admin_session", id: row.session.id },
      {},
    );
    return next;
  });
}
export async function revokeSession(id: string): Promise<void> {
  await withTransaction(async (tx) => {
    const row = await revokeSessionRecord(tx, id);
    if (row)
      await appendAudit(
        tx,
        await actorFor(tx, row.adminId),
        "admin.logged_out",
        { type: "admin_session", id },
        {},
      );
  });
}
