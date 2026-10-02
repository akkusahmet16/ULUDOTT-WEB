import "server-only";
import { getTeamCardSummaries } from "../../cards/application/card-service.ts";
import { z } from "zod";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import {
  teamAccess,
  teamSessions,
  teams,
  memberships,
} from "../../../db/schema/ulujam.ts";
import {
  randomToken,
  tokenHash,
  hashPassword,
  verifyPassword,
} from "../../../lib/auth/crypto.ts";
import { readCookie } from "../../../lib/auth/csrf.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { lockTeam } from "../infrastructure/team-repository.ts";
import { encryptReplay } from "../../forms/infrastructure/submission-repository.ts";
import { teamRate } from "./team-rate.ts";
export const TEAM_COOKIE = "__Host-uludott_team";
const privateToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export async function loginTeam(token: string, password: string) {
  privateToken.parse(token);
  z.string().min(1).max(128).parse(password);
  await teamRate("team_login", token);
  return withTransaction(async (tx) => {
    const [initial] = await tx
      .select()
      .from(teamAccess)
      .where(eq(teamAccess.tokenHash, tokenHash(token)));
    if (!initial) throw new SubmissionError(403, "Takım erişimi geçersiz");
    await lockTeam(tx, initial.teamId);
    const [access] = await tx
      .select()
      .from(teamAccess)
      .where(eq(teamAccess.tokenHash, tokenHash(token)))
      .for("update");
    if (!access || !(await verifyPassword(access.passwordHash, password)))
      throw new SubmissionError(403, "Takım erişimi geçersiz");
    const session = randomToken(),
      expiresAt = new Date(Date.now() + 30 * 60000);
    await tx.insert(teamSessions).values({
      teamId: access.teamId,
      tokenHash: tokenHash(session),
      accessRevision: access.revision,
      expiresAt,
    });
    return { token: session, teamId: access.teamId, expiresAt };
  });
}
export async function requireTeamSession(request: Request, teamId: string) {
  z.uuid().parse(teamId);
  const token = readCookie(request, TEAM_COOKIE) ?? "";
  if (!privateToken.safeParse(token).success)
    throw new SubmissionError(403, "Takım oturumu gerekli");
  const [s] = await getDatabase()
    .select({ id: teamSessions.id, teamId: teamSessions.teamId })
    .from(teamSessions)
    .innerJoin(
      teamAccess,
      and(
        eq(teamAccess.teamId, teamSessions.teamId),
        eq(teamAccess.revision, teamSessions.accessRevision),
      ),
    )
    .where(
      and(
        eq(teamSessions.tokenHash, tokenHash(token)),
        eq(teamSessions.teamId, teamId),
        isNull(teamSessions.revokedAt),
        sql`${teamSessions.expiresAt}>now()`,
      ),
    );
  if (!s) throw new SubmissionError(403, "Takım oturumu gerekli");
  return s;
}
export async function logoutTeam(request: Request) {
  const token = readCookie(request, TEAM_COOKIE);
  if (token)
    await getDatabase()
      .update(teamSessions)
      .set({ revokedAt: new Date() })
      .where(eq(teamSessions.tokenHash, tokenHash(token)));
}
export async function rotateTeamAccess(actor: Actor, teamId: string) {
  z.uuid().parse(teamId);
  return withTransaction(async (tx) => {
    const t = await lockTeam(tx, teamId);
    requirePermission(actor, "teams.write", t.eventId);
    const token = randomToken(),
      password = randomToken();
    const [access] = await tx
      .update(teamAccess)
      .set({
        tokenHash: tokenHash(token),
        passwordHash: await hashPassword(password),
        tokenEncrypted: encryptReplay({ token }, "team-access:" + teamId),
        revision: sql`${teamAccess.revision}+1`,
        rotatedAt: new Date(),
      })
      .where(eq(teamAccess.teamId, teamId))
      .returning();
    if (!access) throw new SubmissionError(404, "Takım erişimi bulunamadı");
    await tx
      .update(teamSessions)
      .set({ revokedAt: new Date() })
      .where(eq(teamSessions.teamId, teamId));
    await appendAudit(
      tx,
      actor,
      "team.access_rotated",
      { type: "team", id: teamId },
      { revision: access.revision },
    );
    return { id: teamId, token, password };
  });
}
export async function getTeamView(token: string, request: Request) {
  privateToken.parse(token);
  const [a] = await getDatabase()
    .select({ teamId: teamAccess.teamId })
    .from(teamAccess)
    .where(eq(teamAccess.tokenHash, tokenHash(token)));
  if (!a) throw new SubmissionError(404, "Takım bulunamadı");
  const session = await requireTeamSession(request, a.teamId);
  const [t] = await getDatabase()
    .select({
      name: teams.name,
      status: teams.status,
      expectedSize: teams.expectedSize,
    })
    .from(teams)
    .where(eq(teams.id, a.teamId));
  const [{ n }] = await getDatabase()
    .select({ n: sql<number>`count(*)::int` })
    .from(memberships)
    .where(and(eq(memberships.teamId, a.teamId), isNull(memberships.leftAt)));
  return { ...t, memberCount: n, cards: await getTeamCardSummaries(session) };
}
