import { refreshApplicationCards } from "../../cards/application/card-revision.ts";
import "server-only";
import { z } from "zod";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { events } from "../../../db/schema/content.ts";
import { applications, teams, memberships } from "../../../db/schema/ulujam.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { addMember } from "../../teams/infrastructure/team-repository.ts";
import {
  recommendTeams,
  type AvailableTeam,
} from "../domain/recommendation.ts";
import { skillKeys, skillSchema } from "../domain/skills.ts";
export type AssignmentResult = {
  participantId: string;
  teamId: string | null;
  rosterRevision: number;
};
export async function assignParticipant(
  actor: Actor,
  participantId: string,
  teamId: string,
  expectedRevision: number,
): Promise<AssignmentResult> {
  return changeAssignment(
    actor,
    participantId,
    teamId,
    expectedRevision,
    false,
  );
}
export async function unassignParticipant(
  actor: Actor,
  participantId: string,
  teamId: string,
  expectedRevision: number,
): Promise<AssignmentResult> {
  return changeAssignment(actor, participantId, teamId, expectedRevision, true);
}
async function changeAssignment(
  actor: Actor,
  participantId: string,
  teamId: string,
  expectedRevision: number,
  undo: boolean,
): Promise<AssignmentResult> {
  z.uuid().parse(participantId);
  z.uuid().parse(teamId);
  z.int().positive().parse(expectedRevision);
  return withTransaction(async (tx) => {
    const [initial] = await tx
      .select({ eventId: applications.eventId })
      .from(applications)
      .where(eq(applications.id, participantId));
    if (!initial) throw new SubmissionError(404, "Katılımcı bulunamadı");
    requirePermission(actor, "teams.write", initial.eventId);
    requirePermission(actor, "applications.write", initial.eventId);
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, initial.eventId))
      .for("update");
    if (!event || event.kind !== "ulujam" || event.status === "archived")
      throw new SubmissionError(409, "Etkinlik atamaya kapalı");
    const [participant] = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, participantId))
      .for("update");
    if (
      !participant ||
      participant.mode !== "seeking" ||
      ["rejected", "withdrawn"].includes(participant.status)
    )
      throw new SubmissionError(409, "Katılımcı atamaya uygun değil");
    if (!undo && participant.submissionId) {
      const [retained] = await tx.execute(
        sql`select id from submissions where id=${participant.submissionId} and expires_at>clock_timestamp() for share`,
      );
      if (!retained)
        throw new SubmissionError(410, "Başvurunun saklama süresi doldu");
    }
    const [active] = await tx
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.applicationId, participantId),
          isNull(memberships.leftAt),
        ),
      );
    const locked = await tx
      .select()
      .from(teams)
      .where(
        inArray(
          teams.id,
          [...new Set([teamId, ...(active ? [active.teamId] : [])])].sort(),
        ),
      )
      .orderBy(teams.id)
      .for("update");
    const target = locked.find((t) => t.id === teamId);
    if (!target || target.eventId !== initial.eventId)
      throw new SubmissionError(409, "Takım etkinliği uyuşmuyor");
    if (target.rosterRevision !== expectedRevision)
      throw Error("Sürüm çakışması");
    if (undo && active?.teamId !== teamId)
      throw new SubmissionError(409, "Atama artık geçerli değil");
    if (!undo && active?.teamId === teamId)
      throw new SubmissionError(409, "Katılımcı zaten bu takımda");
    if (active) {
      await tx
        .update(memberships)
        .set({ leftAt: sql`now()` })
        .where(eq(memberships.id, active.id));
      await tx
        .update(teams)
        .set({ rosterRevision: sql`${teams.rosterRevision}+1` })
        .where(eq(teams.id, active.teamId));
    }
    let revision = target.rosterRevision + 1;
    if (!undo)
      revision = (await addMember(tx, teamId, participantId)).rosterRevision;
    await refreshApplicationCards(tx, [participantId]);
    await appendAudit(
      tx,
      actor,
      undo ? "matching.unassigned" : "matching.assigned",
      { type: "application", id: participantId },
      {
        revision,
        previousRevision: expectedRevision,
        changedFields: ["rosterRevision"],
      },
    );
    return {
      participantId,
      teamId: undo ? null : teamId,
      rosterRevision: revision,
    };
  });
}
const filters = z.strictObject({
  eventId: z.uuid(),
  skill: z.enum(skillKeys).optional(),
  minLevel: z.coerce.number().int().min(1).max(5).default(1),
  cursor: z.uuid().optional(),
  teamCursor: z.uuid().optional(),
});
const levels = z.array(skillSchema);
export async function seekerBoard(actor: Actor, raw: unknown) {
  const input = filters.parse(raw);
  requirePermission(actor, "applications.read", input.eventId);
  requirePermission(actor, "teams.read", input.eventId);
  return withTransaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, input.eventId));
    if (!event || event.kind !== "ulujam")
      throw new SubmissionError(404, "UluJam bulunamadı");
    const rows = await tx.execute(sql`select a.id,a.full_name,
 coalesce((select jsonb_agg(jsonb_build_object('skill',s.skill,'level',s.level) order by s.skill) from application_skills s where s.application_id=a.id),'[]'::jsonb) as skills,
 (select jsonb_build_object('id',t.id,'name',t.name,'rosterRevision',t.roster_revision) from memberships m join teams t on t.id=m.team_id where m.application_id=a.id and m.left_at is null) as assigned
 from applications a where a.event_id=${input.eventId} and a.mode='seeking' and a.status in ('pending','approved','changes_requested')
 and (a.submission_id is null or exists(select 1 from submissions sub where sub.id=a.submission_id and sub.expires_at>now()))
 ${input.skill ? sql`and exists(select 1 from application_skills s where s.application_id=a.id and s.skill=${input.skill} and s.level>=${input.minLevel})` : sql`and exists(select 1 from application_skills s where s.application_id=a.id and s.level>=${input.minLevel})`}
 ${input.cursor ? sql`and a.id>${input.cursor}::uuid` : sql``} order by a.id limit 51`);
    const candidateRows =
      await tx.execute(sql`select t.id,t.name,t.expected_size,t.roster_revision,
 (select count(*)::int from memberships m where m.team_id=t.id and m.left_at is null) as member_count,
 coalesce((select jsonb_agg(jsonb_build_object('skill',s.skill,'level',s.level)) from application_skills s join memberships m on m.application_id=s.application_id join applications a on a.id=s.application_id where m.team_id=t.id and m.left_at is null and (a.submission_id is null or exists(select 1 from submissions sub where sub.id=a.submission_id and sub.expires_at>now()))),'[]'::jsonb) as skills
 from teams t where t.event_id=${input.eventId} and t.status in ('pending','approved','changes_requested') and (select count(*) from memberships m where m.team_id=t.id and m.left_at is null)<t.expected_size
 ${input.teamCursor ? sql`and t.id>${input.teamCursor}::uuid` : sql``} order by t.id limit 51`);
    const candidates: AvailableTeam[] = candidateRows.slice(0, 50).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      expectedSize: Number(r.expected_size),
      memberCount: Number(r.member_count),
      rosterRevision: Number(r.roster_revision),
      skills: levels.parse(r.skills),
    }));
    const assignedSchema = z.strictObject({
      id: z.uuid(),
      name: z.string(),
      rosterRevision: z.int().positive(),
    });
    return {
      items: rows.slice(0, 50).map((r) => {
        const skills = levels.parse(r.skills),
          assigned = r.assigned ? assignedSchema.parse(r.assigned) : null;
        return {
          id: String(r.id),
          fullName: String(r.full_name),
          skills,
          assigned,
          recommendations: assigned
            ? []
            : recommendTeams({ skills }, candidates),
        };
      }),
      nextCursor: rows.length > 50 ? String(rows[49].id) : null,
      nextTeamCursor:
        candidateRows.length > 50 ? String(candidateRows[49].id) : null,
    };
  });
}
export type SeekerBoardData = Awaited<ReturnType<typeof seekerBoard>>;
