import "server-only";
import { z } from "zod";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { events } from "../../../db/schema/content.ts";
import {
  applications,
  teams,
  memberships,
  teamApprovals,
} from "../../../db/schema/ulujam.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { validateDecision, type ApprovalDecision } from "../domain/approval.ts";
import { refreshApplicationCards } from "../../cards/application/card-revision.ts";
import { cardEligibility } from "../../cards/domain/card-eligibility.ts";
import { skillSchema } from "../../matching/domain/skills.ts";
async function lockEvent(tx: DbTx, actor: Actor, eventId: string) {
  requirePermission(actor, "teams.approve", eventId);
  const [event] = await tx
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .for("update");
  if (
    !event ||
    event.kind !== "ulujam" ||
    ["cancelled", "archived"].includes(event.status)
  )
    throw new SubmissionError(409, "Etkinlik onaya kapalı");
}
async function retained(tx: DbTx, submissionId: string | null) {
  if (submissionId) {
    const [s] = await tx.execute(
      sql`select id from submissions where id=${submissionId} and expires_at>clock_timestamp() for share`,
    );
    if (!s) throw new SubmissionError(410, "Başvurunun saklama süresi doldu");
  }
}
export const approveRoster = (actor: Actor, id: string, revision: number) =>
  decideRoster(actor, id, "approved", undefined, revision);
export const requestRosterChanges = (
  actor: Actor,
  id: string,
  reason: string,
  revision?: number,
) => decideRoster(actor, id, "changes_requested", reason, revision);
export const rejectTeam = (
  actor: Actor,
  id: string,
  reason: string,
  revision?: number,
) => decideRoster(actor, id, "rejected", reason, revision);
async function decideRoster(
  actor: Actor,
  id: string,
  status: ApprovalDecision,
  reason?: string,
  expectedRevision?: number,
) {
  z.uuid().parse(id);
  if (expectedRevision !== undefined)
    z.int().positive().parse(expectedRevision);
  return withTransaction(async (tx) => {
    const [initial] = await tx
      .select({ eventId: teams.eventId })
      .from(teams)
      .where(eq(teams.id, id));
    if (!initial) throw new SubmissionError(404, "Takım bulunamadı");
    await lockEvent(tx, actor, initial.eventId);
    const [team] = await tx
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .for("update");
    if (
      expectedRevision !== undefined &&
      team.rosterRevision !== expectedRevision
    )
      throw Error("Sürüm çakışması");
    const note = validateDecision(team.status, status, reason);
    const members = await tx
      .select({
        id: applications.id,
        submissionId: applications.submissionId,
        status: applications.status,
      })
      .from(memberships)
      .innerJoin(applications, eq(applications.id, memberships.applicationId))
      .where(and(eq(memberships.teamId, id), isNull(memberships.leftAt)))
      .orderBy(applications.id)
      .for("update", { of: applications });
    if (status === "approved") {
      if (!members.length)
        throw new SubmissionError(409, "Boş kadro onaylanamaz");
      for (const member of members) {
        if (["rejected", "withdrawn"].includes(member.status))
          throw new SubmissionError(409, "Kadrodaki başvuru uygun değil");
        await retained(tx, member.submissionId);
      }
    }
    const revision = team.rosterRevision + 1;
    await tx
      .insert(teamApprovals)
      .values({ teamId: id, revision, status, note, actorId: actor.adminId });
    await tx
      .update(teams)
      .set({ status, rosterRevision: revision })
      .where(eq(teams.id, id));
    if (status === "approved") {
      await tx
        .update(memberships)
        .set({ approvedRevision: revision })
        .where(and(eq(memberships.teamId, id), isNull(memberships.leftAt)));
      await tx
        .update(applications)
        .set({
          status: "approved",
          approvedBy: actor.adminId,
          approvedAt: sql`now()`,
          revision: sql`${applications.revision}+1`,
        })
        .where(
          inArray(
            applications.id,
            members.map((m) => m.id),
          ),
        );
    }
    await refreshApplicationCards(
      tx,
      members.map((m) => m.id),
    );
    await appendAudit(
      tx,
      actor,
      "team." + status,
      { type: "team", id },
      {
        status,
        revision,
        previousRevision: team.rosterRevision,
        recordCount: members.length,
        changedFields: ["status", "rosterRevision"],
      },
    );
    return { id, revision, status };
  });
}
export const approveSolo = (actor: Actor, id: string, revision?: number) =>
  decideSolo(actor, id, "approved", undefined, revision);
export async function decideSolo(
  actor: Actor,
  id: string,
  status: ApprovalDecision,
  reason?: string,
  expectedRevision?: number,
) {
  z.uuid().parse(id);
  if (expectedRevision !== undefined)
    z.int().positive().parse(expectedRevision);
  return withTransaction(async (tx) => {
    const [initial] = await tx
      .select({ eventId: applications.eventId })
      .from(applications)
      .where(eq(applications.id, id));
    if (!initial) throw new SubmissionError(404, "Katılımcı bulunamadı");
    await lockEvent(tx, actor, initial.eventId);
    const [a] = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .for("update");
    if (a.mode !== "solo")
      throw new SubmissionError(409, "Bireysel katılım uygun değil");
    if (expectedRevision !== undefined && a.revision !== expectedRevision)
      throw Error("Sürüm çakışması");
    const note = validateDecision(a.status, status, reason);
    if (status === "approved") await retained(tx, a.submissionId);
    const revision = a.revision + 1;
    await tx
      .update(applications)
      .set({
        status,
        revision,
        reviewNote: note,
        approvedBy: status === "approved" ? actor.adminId : null,
        approvedAt: status === "approved" ? sql`now()` : null,
      })
      .where(eq(applications.id, id));
    await refreshApplicationCards(tx, [id]);
    await appendAudit(
      tx,
      actor,
      "solo." + status,
      { type: "application", id },
      {
        status,
        revision,
        previousRevision: a.revision,
        changedFields: ["status"],
      },
    );
    return { id, revision, status };
  });
}
export async function listApprovals(
  actor: Actor,
  eventId: string,
  cursor?: string,
  soloCursor?: string,
) {
  z.uuid().parse(eventId);
  if (cursor) z.uuid().parse(cursor);
  if (soloCursor) z.uuid().parse(soloCursor);
  requirePermission(actor, "teams.read", eventId);
  requirePermission(actor, "applications.read", eventId);
  return withTransaction(async (tx) => {
    const [event] = await tx
      .select({ title: events.title, maxTeamSize: events.maxTeamSize })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.kind, "ulujam")));
    if (!event) throw new SubmissionError(404, "UluJam bulunamadı");
    const teamRows = await tx.execute(
      sql`select t.id,t.name,t.status,t.expected_size,t.roster_revision,(select note from team_approvals ap where ap.team_id=t.id order by revision desc limit 1) note from teams t where t.event_id=${eventId} ${cursor ? sql`and t.id>${cursor}::uuid` : sql``} order by t.id limit 51`,
    );
    const ids = teamRows.slice(0, 50).map((t) => String(t.id));
    const rows = ids.length
      ? await tx.execute(sql`select a.id,a.full_name,a.status,a.mode,a.created_at,m.team_id,(ap.status='approved') member_approved,
 (a.submission_id is not null and not exists(select 1 from submissions s where s.id=a.submission_id and s.expires_at>now())) expired,
 coalesce((select jsonb_agg(jsonb_build_object('skill',s.skill,'level',s.level) order by s.skill) from application_skills s where s.application_id=a.id),'[]'::jsonb) skills
 from memberships m join applications a on a.id=m.application_id left join team_approvals ap on ap.team_id=m.team_id and ap.revision=m.approved_revision where m.team_id in (${sql.join(
   ids.map((id) => sql`${id}::uuid`),
   sql`,`,
 )}) and m.left_at is null order by a.id`)
      : [];
    const soloRows = await tx.execute(
      sql`select a.id,a.full_name,a.status,a.revision,a.created_at,a.review_note from applications a where a.event_id=${eventId} and a.mode='solo' and (a.submission_id is null or exists(select 1 from submissions s where s.id=a.submission_id and s.expires_at>now())) ${soloCursor ? sql`and a.id>${soloCursor}::uuid` : sql``} order by a.id limit 51`,
    );
    return {
      event,
      ...{
        teams: teamRows.slice(0, 50).map((t) => {
          const members = rows
            .filter((r) => r.team_id === t.id)
            .map((r) => ({
              id: String(r.id),
              fullName: r.expired
                ? "Saklama süresi doldu"
                : String(r.full_name),
              skills: r.expired ? [] : z.array(skillSchema).parse(r.skills),
              createdAt: new Date(r.created_at as string).toISOString(),
              cardStatus: cardEligibility(
                {
                  mode: String(r.mode),
                  status: String(r.status),
                  expired: r.expired === true,
                },
                {
                  status: String(t.status),
                  memberApproved: r.member_approved === true,
                },
              ),
            }));
          return {
            id: String(t.id),
            name: String(t.name),
            status: String(t.status),
            revision: Number(t.roster_revision),
            expectedSize: Number(t.expected_size),
            memberCount: members.length,
            members,
            note: t.note ? String(t.note) : null,
            pendingCount: members.filter((m) => m.cardStatus === "pending")
              .length,
          };
        }),
        solos: soloRows
          .slice(0, 50)
          .map((a) => ({
            id: String(a.id),
            fullName: String(a.full_name),
            status: String(a.status),
            revision: Number(a.revision),
            note: a.review_note ? String(a.review_note) : null,
            createdAt: new Date(a.created_at as string).toISOString(),
          })),
      },
      nextCursor: teamRows.length > 50 ? String(teamRows[49].id) : null,
      nextSoloCursor: soloRows.length > 50 ? String(soloRows[49].id) : null,
    };
  });
}
export type ApprovalQueueData = Awaited<ReturnType<typeof listApprovals>>;
