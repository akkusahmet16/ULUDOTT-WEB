import "server-only";
import { createApplicationCard } from "../../cards/application/card-service.ts";
import { z } from "zod";
import { eq, and, sql, gt } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { forms, submissions } from "../../../db/schema/forms.ts";
import { events } from "../../../db/schema/content.ts";
import { applications, teamAccess } from "../../../db/schema/ulujam.ts";
import { idempotencyRecords } from "../../../db/schema/operations.ts";
import { tokenHash } from "../../../lib/auth/crypto.ts";
import {
  validateUlujamInput,
  ulujamFields as f,
} from "../domain/ulujam-input.ts";
import type { Skill } from "../../matching/domain/skills.ts";
import { readFormVersion } from "../../forms/infrastructure/form-repository.ts";
import { validateSubmission } from "../../forms/application/form-validator.ts";
import {
  submitFormInTransaction,
  receiptSchema,
} from "../../forms/application/submit-form.ts";
import {
  canonicalJson,
  encryptReplay,
  decryptReplay,
} from "../../forms/infrastructure/submission-repository.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { insertApplication } from "../infrastructure/application-repository.ts";
import {
  createTeamWithFounder,
  joinTeam,
} from "../../teams/application/team-service.ts";
import { teamRate } from "../../teams/application/team-rate.ts";
const envelope = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]{1,100}$/),
  versionId: z.uuid(),
  answers: z.unknown(),
  teamId: z.uuid().optional(),
  password: z.string().min(1).max(128).optional(),
});
const teamReceipt = z.strictObject({
  id: z.uuid(),
  token: z.string().regex(/^[\w-]{43}$/),
  password: z
    .string()
    .regex(/^[\w-]{43}$/)
    .optional(),
});
export const ulujamReceiptSchema = receiptSchema.extend({
  team: teamReceipt.optional(),
  card: z
    .strictObject({ id: z.uuid(), token: z.string().regex(/^[\w-]{43}$/) })
    .optional(),
});
export type UlujamReceipt = z.infer<typeof ulujamReceiptSchema>;
export async function submitUlujam(
  raw: unknown,
  key: string,
): Promise<UlujamReceipt> {
  const input = envelope.parse(raw);
  z.string()
    .regex(/^[A-Za-z0-9_-]{16,200}$/)
    .parse(key);
  await teamRate("ulujam_submit", "global", 120);
  if (input.teamId) await teamRate("team_join", input.teamId, 20);
  const hash = tokenHash(canonicalJson(input));
  return withTransaction(async (tx) => {
    const [form] = await tx
      .select()
      .from(forms)
      .where(eq(forms.slug, input.slug))
      .for("update");
    if (!form?.eventId) throw new SubmissionError(404, "Form bulunamadı");
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, form.eventId))
      .for("update");
    if (!event || event.kind !== "ulujam")
      throw new SubmissionError(409, "UluJam başvurusu açık değil");
    const scope = "ulujam:" + form.id,
      where = and(
        eq(idempotencyRecords.scope, scope),
        eq(idempotencyRecords.keyHash, tokenHash(key)),
      );
    const [prior] = await tx.select().from(idempotencyRecords).where(where);
    if (prior && prior.expiresAt > new Date()) {
      if (prior.requestHash !== hash)
        throw new SubmissionError(
          409,
          "İstek anahtarı farklı yanıtla kullanıldı",
        );
      const [exists] = await tx
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(
            eq(submissions.id, prior.resourceId!),
            gt(submissions.expiresAt, new Date()),
          ),
        );
      if (!exists || !prior.responseEncrypted)
        throw new SubmissionError(410, "Başvuru artık saklanmıyor");
      const result = ulujamReceiptSchema.parse(
        decryptReplay(prior.responseEncrypted, scope),
      );
      if (result.team) {
        const [access] = await tx
          .select()
          .from(teamAccess)
          .where(
            and(
              eq(teamAccess.teamId, result.team.id),
              eq(teamAccess.tokenHash, tokenHash(result.team.token)),
            ),
          );
        if (!access) delete result.team;
      }
      return result;
    }
    if (
      event.status !== "published" ||
      !event.startsAt ||
      (event.endsAt && event.endsAt <= new Date())
    )
      throw new SubmissionError(409, "UluJam başvurusu açık değil");
    if (prior) await tx.delete(idempotencyRecords).where(where);
    const version = await readFormVersion(tx, input.versionId);
    if (version.formId !== form.id)
      throw new SubmissionError(400, "Form sürümü geçersiz");
    const answers = validateSubmission(version, input.answers),
      mode = answers[f.mode],
      selected = answers[f.skills];
    if (mode !== "existing" && (input.teamId || input.password))
      throw new SubmissionError(400, "Mod alanları uyuşmuyor");
    const application = validateUlujamInput({
      eventId: event.id,
      fullName: answers[f.fullName],
      email: answers[f.email],
      phone: answers[f.phone],
      mode,
      skills: Array.isArray(selected)
        ? selected.map((skill) => ({
            skill,
            level: answers[f.levels[skill as Skill]],
          }))
        : [],
      ...(answers[f.skillDescription] !== undefined
        ? { skillDescription: answers[f.skillDescription] }
        : {}),
      ...(mode === "new"
        ? {
            teamName: answers[f.teamName],
            expectedSize: answers[f.expectedSize],
          }
        : {}),
      ...(mode === "existing"
        ? { teamId: input.teamId, password: input.password }
        : {}),
    });
    const [duplicate] = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.eventId, event.id),
          eq(applications.email, application.email),
        ),
      );
    if (duplicate)
      throw new SubmissionError(409, "Bu e-posta ile başvuru mevcut");
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(applications)
      .where(
        and(
          eq(applications.eventId, event.id),
          sql`${applications.status} not in ('rejected','withdrawn')`,
        ),
      );
    if (event.capacity !== null && n >= event.capacity)
      throw new SubmissionError(409, "Etkinlik kontenjanı doldu");
    const receipt = await submitFormInTransaction(
      tx,
      input.slug,
      answers,
      key,
      { versionId: input.versionId, ulujam: true },
    );
    if (receipt.status === "waitlisted")
      throw new SubmissionError(409, "UluJam kontenjanı doldu");
    const a = await insertApplication(tx, application, receipt.id);
    let team: UlujamReceipt["team"];
    if (application.mode === "new")
      team = await createTeamWithFounder(tx, {
        eventId: event.id,
        participantId: a.id,
        name: application.teamName,
        expectedSize: application.expectedSize,
      });
    if (application.mode === "existing") {
      const joined = await joinTeam(
        tx,
        application.teamId,
        a.id,
        application.password,
      );
      team = { id: joined.id, token: joined.token };
    }
    const card = await createApplicationCard(tx, a.id);
    const result = { ...receipt, card, ...(team ? { team } : {}) };
    await tx.insert(idempotencyRecords).values({
      scope,
      keyHash: tokenHash(key),
      requestHash: hash,
      resourceId: receipt.id,
      responseEncrypted: encryptReplay(result, scope),
      expiresAt: new Date(Date.now() + 86400000),
    });
    return result;
  });
}
