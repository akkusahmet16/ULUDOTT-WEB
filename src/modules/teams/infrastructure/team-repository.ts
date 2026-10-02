import "server-only";
import { eq, and, isNull, sql } from "drizzle-orm";
import { teams, memberships, applications } from "../../../db/schema/ulujam.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
export async function lockTeam(tx: DbTx, id: string) {
  const [t] = await tx
    .select()
    .from(teams)
    .where(eq(teams.id, id))
    .for("update");
  if (!t) throw new SubmissionError(404, "Takım bulunamadı");
  return t;
}
export async function addMember(
  tx: DbTx,
  teamId: string,
  participantId: string,
) {
  const t = await lockTeam(tx, teamId);
  if (!["pending", "approved", "changes_requested"].includes(t.status))
    throw new SubmissionError(409, "Takım katılıma kapalı");
  const [a] = await tx
    .select()
    .from(applications)
    .where(eq(applications.id, participantId));
  if (
    !a ||
    a.eventId !== t.eventId ||
    ["rejected", "withdrawn"].includes(a.status)
  )
    throw new SubmissionError(409, "Katılımcı uygun değil");
  const [{ n }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(memberships)
    .where(and(eq(memberships.teamId, t.id), isNull(memberships.leftAt)));
  if (n >= t.expectedSize)
    throw new SubmissionError(409, "Takım kontenjanı doldu");
  await tx
    .insert(memberships)
    .values({
      teamId: t.id,
      eventId: t.eventId,
      applicationId: participantId,
      approvedRevision: null,
    });
  const [updated] = await tx
    .update(teams)
    .set({ rosterRevision: sql`${teams.rosterRevision}+1` })
    .where(eq(teams.id, t.id))
    .returning();
  return updated;
}
