import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import {
  submissions,
  submissionAnswers,
  consents,
} from "../../../db/schema/forms.ts";
import {
  applications,
  applicationSkills,
  memberships,
  teams,
} from "../../../db/schema/ulujam.ts";
import { admins } from "../../../db/schema/admin.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { actorFor } from "../../admin/infrastructure/admin-repository.ts";
import {
  getSubmission,
  correctSubmission,
} from "../../forms/application/submission-admin.ts";
import { readFormVersion } from "../../forms/infrastructure/form-repository.ts";
import { skillsSchema } from "../../matching/domain/skills.ts";
import type { Skill } from "../../matching/domain/skills.ts";
import { ulujamFields as fields } from "../domain/ulujam-input.ts";
import { refreshApplicationCards } from "../../cards/application/card-revision.ts";
const marker: unique symbol = Symbol("verified-requester");
export type VerifiedRequester = { readonly [marker]: true };
const grants = new WeakMap<
  object,
  { adminId: string; personId: string; expiresAt: number }
>();
async function authorized(
  tx: DbTx,
  who: Actor | VerifiedRequester,
  id: string,
  permission: string,
) {
  z.uuid().parse(id);
  let actor: Actor;
  if (grants.has(who)) {
    const grant = grants.get(who)!;
    if (grant.personId !== id || grant.expiresAt <= Date.now())
      throw Error("Doğrulama geçersiz");
    const [admin] = await tx
      .select({ disabledAt: admins.disabledAt })
      .from(admins)
      .where(eq(admins.id, grant.adminId));
    if (!admin || admin.disabledAt) throw Error("Doğrulama geçersiz");
    actor = await actorFor(tx, grant.adminId);
  } else {
    if (!("roles" in who) || !Array.isArray(who.roles))
      throw Error("Doğrulama gerekli");
    actor = who as Actor;
  }
  const [subject] = await tx
    .select({ eventId: submissions.eventId, formId: submissions.formId })
    .from(submissions)
    .where(and(eq(submissions.id, id), sql`${submissions.expiresAt}>now()`));
  if (!subject) throw Error("Kayıt bulunamadı");
  requirePermission(actor, permission, subject.eventId ?? undefined);
  return { actor, ...subject };
}
export async function verifyRequesterByAdmin(
  actor: Actor,
  personId: string,
  evidence: {
    method: "in_person" | "existing_contact_challenge";
    referenceId: string;
  },
): Promise<VerifiedRequester> {
  z.strictObject({
    method: z.enum(["in_person", "existing_contact_challenge"]),
    referenceId: z.uuid(),
  }).parse(evidence);
  await withTransaction(async (tx) => {
    await authorized(tx, actor, personId, "applications.export");
    await appendAudit(
      tx,
      actor,
      "privacy.verified",
      { type: "submission", id: personId },
      {},
    );
  });
  const grant = Object.freeze({ [marker]: true as const });
  grants.set(grant, {
    adminId: actor.adminId,
    personId,
    expiresAt: Date.now() + 300000,
  });
  return grant;
}
export async function exportPersonData(
  who: Actor | VerifiedRequester,
  personId: string,
) {
  const { actor } = await withTransaction((tx) =>
    authorized(tx, who, personId, "applications.export"),
  );
  const s = await getSubmission(actor, personId);
  return withTransaction(async (tx) => {
    await authorized(tx, who, personId, "applications.export");
    const [a] = await tx
      .select({
        id: applications.id,
        fullName: applications.fullName,
        email: applications.email,
        phone: applications.phone,
        mode: applications.mode,
        status: applications.status,
        skillDescription: applications.skillDescription,
      })
      .from(applications)
      .where(eq(applications.submissionId, personId));
    const skills = a
      ? await tx
          .select({
            skill: applicationSkills.skill,
            level: applicationSkills.level,
          })
          .from(applicationSkills)
          .where(eq(applicationSkills.applicationId, a.id))
      : [];
    const teamHistory = a
      ? await tx
          .select({
            name: teams.name,
            joinedAt: memberships.joinedAt,
            leftAt: memberships.leftAt,
          })
          .from(memberships)
          .innerJoin(teams, eq(teams.id, memberships.teamId))
          .where(eq(memberships.applicationId, a.id))
      : [];
    await appendAudit(
      tx,
      actor,
      "privacy.exported",
      { type: "submission", id: personId },
      { recordCount: 1 },
    );
    return {
      id: s.id,
      eventId: s.eventId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      answers: s.answers,
      consents: s.consents,
      status: s.status,
      application: a ?? null,
      skills,
      teamHistory,
    };
  });
}
export async function correctPersonData(
  who: Actor | VerifiedRequester,
  personId: string,
  changes: unknown,
) {
  const d = z
    .strictObject({
      expectedRevision: z.int().positive(),
      answers: z.record(z.string(), z.unknown()),
    })
    .parse(changes);
  return withTransaction(async (tx) => {
    const scope = await authorized(tx, who, personId, "applications.write");
    await tx.execute(
      sql`select id from forms where id=${scope.formId}::uuid for update`,
    );
    if (scope.eventId)
      await tx.execute(
        sql`select id from events where id=${scope.eventId}::uuid for update`,
      );
    const [a] = await tx
      .select()
      .from(applications)
      .where(eq(applications.submissionId, personId))
      .for("update");
    if (a) {
      const old = await tx
        .select()
        .from(submissionAnswers)
        .where(eq(submissionAnswers.submissionId, personId));
      for (const key of [
        fields.mode,
        fields.teamId,
        fields.teamName,
        fields.expectedSize,
      ])
        if (
          JSON.stringify(d.answers[key]) !==
          JSON.stringify(old.find((r) => r.fieldKey === key)?.value)
        )
          throw Error("Takım değişikliği ayrı onay akışından yapılmalı");
    }
    const result = await correctSubmission(
      scope.actor,
      personId,
      d.answers,
      d.expectedRevision,
      tx,
    );
    if (a) {
      const name = z
        .string()
        .trim()
        .min(1)
        .max(160)
        .parse(d.answers[fields.fullName]);
      const email = z
        .email()
        .transform((v) => v.trim().toLowerCase())
        .parse(d.answers[fields.email]);
      const phone = z
        .string()
        .regex(/^\+[1-9][0-9]{7,14}$/)
        .parse(d.answers[fields.phone]);
      const selected = d.answers[fields.skills];
      const skills = skillsSchema.parse(
        Array.isArray(selected)
          ? selected.map((skill) => ({
              skill,
              level: d.answers[fields.levels[skill as Skill]],
            }))
          : [],
      );
      const skillDescription =
        d.answers[fields.skillDescription] === undefined
          ? null
          : z
              .string()
              .trim()
              .max(2000)
              .parse(d.answers[fields.skillDescription]);
      if (skills.length > 1 && !skillDescription)
        throw Error("Çoklu beceri açıklaması gerekli");
      await tx
        .delete(applicationSkills)
        .where(eq(applicationSkills.applicationId, a.id));
      await tx
        .insert(applicationSkills)
        .values(skills.map((s) => ({ ...s, applicationId: a.id })));
      await tx
        .update(applications)
        .set({
          fullName: name,
          email,
          phone,
          skillDescription,
          revision: a.revision + 1,
        })
        .where(eq(applications.id, a.id));
      await refreshApplicationCards(tx, [a.id]);
    }
    await appendAudit(
      tx,
      scope.actor,
      "privacy.corrected",
      { type: "submission", id: personId },
      {
        revision: result.revision,
      },
    );
    return result;
  });
}
export async function recordConsent(
  version: string,
  scope: string,
  subjectId: string,
  at: Date,
) {
  z.string().min(1).max(100).parse(version);
  z.string().min(1).max(100).parse(scope);
  z.uuid().parse(subjectId);
  if (
    !(at instanceof Date) ||
    !Number.isFinite(at.getTime()) ||
    at.getTime() > Date.now() + 1000
  )
    throw Error("Rıza zamanı geçersiz");
  return withTransaction(async (tx) => {
    const [s] = await tx
      .select()
      .from(submissions)
      .where(
        and(eq(submissions.id, subjectId), sql`${submissions.expiresAt}>now()`),
      )
      .for("update");
    if (!s || s.status === "withdrawn" || at < s.createdAt)
      throw Error("Rıza kanıtı geçersiz");
    const definition = await readFormVersion(tx, s.versionId);
    const field = definition.definition.fields.find(
      (f) =>
        f.type === "consent" &&
        f.purpose === scope &&
        f.consentVersion === version,
    );
    if (!field) throw Error("Rıza sürümü eşleşmiyor");
    const [answer] = await tx
      .select()
      .from(submissionAnswers)
      .where(
        and(
          eq(submissionAnswers.submissionId, subjectId),
          eq(submissionAnswers.fieldKey, field.id),
        ),
      );
    if (answer?.value !== true) throw Error("Rıza kanıtı yok");
    const [existing] = await tx
      .select()
      .from(consents)
      .where(
        and(
          eq(consents.submissionId, subjectId),
          eq(consents.purpose, scope),
          eq(consents.textVersion, version),
        ),
      );
    if (existing?.withdrawnAt) throw Error("Rıza geri çekilmiş");
    if (existing)
      return {
        purpose: existing.purpose,
        version: existing.textVersion,
        at: existing.grantedAt,
      };
    await tx.insert(consents).values({
      submissionId: subjectId,
      purpose: scope,
      textVersion: version,
      grantedAt: at,
    });
    return { purpose: scope, version, at };
  });
}
