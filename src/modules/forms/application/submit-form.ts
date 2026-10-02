import "server-only";
import { eq, and, sql, inArray, gt } from "drizzle-orm";
import { z } from "zod";
import { events } from "../../../db/schema/content.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import {
  forms,
  submissions,
  submissionAnswers,
  submissionStatusHistory,
  consents,
} from "../../../db/schema/forms.ts";
import { idempotencyRecords } from "../../../db/schema/operations.ts";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import { settingsSchema } from "../domain/form-settings.ts";
import { boundedJson } from "../domain/form-version.ts";
import { emailIdentity } from "../domain/email-identity.ts";
import { SubmissionError } from "../domain/submission-error.ts";
import { readFormVersion } from "../infrastructure/form-repository.ts";
import {
  canonicalJson,
  encryptReplay,
  decryptReplay,
} from "../infrastructure/submission-repository.ts";
import { validateSubmission } from "./form-validator.ts";
export const receiptSchema = z.strictObject({
  id: z.uuid(),
  receiptToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  status: z.enum(["received", "waitlisted"]),
  message: z.string().max(2000),
});
export type Receipt = z.infer<typeof receiptSchema>;
export async function submitForm(
  slug: string,
  input: unknown,
  key: string,
  context: { versionId?: string },
): Promise<Receipt> {
  return withTransaction((tx) =>
    submitFormInTransaction(tx, slug, input, key, context),
  );
}
export async function submitFormInTransaction(
  tx: DbTx,
  slug: string,
  input: unknown,
  key: string,
  context: { versionId?: string; ulujam?: boolean },
): Promise<Receipt> {
  z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100)
    .parse(slug);
  z.string()
    .regex(/^[A-Za-z0-9_-]{16,200}$/)
    .parse(key);
  boundedJson(input);
  const versionId = context.versionId
    ? z.uuid().parse(context.versionId)
    : undefined;
  const requestHash = tokenHash(canonicalJson({ answers: input, versionId }));
  const [f] = await tx
    .select()
    .from(forms)
    .where(eq(forms.slug, slug))
    .for("update");
  if (!f) throw new SubmissionError(404, "Form bulunamadı");
  if (f.eventId) {
    const [e] = await tx
      .select({ kind: events.kind })
      .from(events)
      .where(eq(events.id, f.eventId));
    if (e?.kind === "ulujam" && !context.ulujam)
      throw new SubmissionError(
        409,
        "UluJam için özel başvuru akışını kullanın",
      );
  }
  const [{ now }] = await tx.execute(sql`select clock_timestamp() as now`);
  const currentTime = new Date(now as string),
    scope = "form:" + f.id,
    keyHash = tokenHash(key),
    where = and(
      eq(idempotencyRecords.scope, scope),
      eq(idempotencyRecords.keyHash, keyHash),
    );
  const [prior] = await tx.select().from(idempotencyRecords).where(where);
  if (prior && prior.expiresAt > currentTime) {
    if (prior.requestHash !== requestHash)
      throw new SubmissionError(
        409,
        "Bu istek anahtarı farklı bir yanıt için kullanıldı. Yeni gönderim başlatın.",
      );
    if (!prior.responseEncrypted || !prior.resourceId)
      throw new SubmissionError(409, "Gönderim durumu doğrulanamadı");
    const [exists] = await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.id, prior.resourceId),
          gt(submissions.expiresAt, currentTime),
        ),
      );
    if (!exists) throw new SubmissionError(410, "Başvuru artık saklanmıyor");
    return receiptSchema.parse(decryptReplay(prior.responseEncrypted, scope));
  }
  if (prior) await tx.delete(idempotencyRecords).where(where);
  if (
    f.status !== "published" ||
    !f.currentVersionId ||
    !f.opensAt ||
    f.opensAt > currentTime ||
    (f.closesAt && f.closesAt <= currentTime)
  )
    throw new SubmissionError(409, "Form şu anda başvuru almıyor");
  if (versionId && versionId !== f.currentVersionId)
    throw new SubmissionError(
      409,
      "Form güncellendi. Sayfayı yenileyip yanıtları tekrar kontrol edin.",
    );
  const version = await readFormVersion(tx, f.currentVersionId);
  if (!version.publishedAt)
    throw new SubmissionError(409, "Form şu anda başvuru almıyor");
  const settings = settingsSchema.parse(f.settings),
    answers = validateSubmission(version, input),
    identity = emailIdentity(version.definition),
    email = identity ? String(answers[identity.id]).trim().toLowerCase() : null;
  if (settings.duplicatePolicy === "reject") {
    if (!email)
      throw new SubmissionError(409, "Form ayarları başvuru için uygun değil");
    const [existing] = await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.formId, f.id),
          eq(submissions.email, email),
          gt(submissions.expiresAt, currentTime),
        ),
      )
      .limit(1);
    if (existing)
      throw new SubmissionError(
        409,
        "Bu form için daha önce başvuru yapıldı. Önceki makbuzunuzu kullanın.",
      );
  }
  const [{ n }] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(submissions)
    .where(
      and(
        eq(submissions.formId, f.id),
        inArray(submissions.status, ["received", "pending", "approved"]),
        gt(submissions.expiresAt, currentTime),
      ),
    );
  const full = f.capacity !== null && n >= f.capacity;
  if (full && !settings.waitlist)
    throw new SubmissionError(409, "Formun kontenjanı doldu");
  const status = full ? ("waitlisted" as const) : ("received" as const),
    receiptToken = randomToken();
  const [s] = await tx
    .insert(submissions)
    .values({
      formId: f.id,
      versionId: version.id,
      eventId: f.eventId,
      email,
      status,
      snapshot: { formTitle: f.title, thankYou: settings.thankYou },
      receiptTokenHash: tokenHash(receiptToken),
      expiresAt: new Date(
        currentTime.getTime() + settings.retentionDays * 86400000,
      ),
    })
    .returning({ id: submissions.id });
  const rows = Object.entries(answers).map(([fieldKey, value]) => ({
    submissionId: s.id,
    versionId: version.id,
    fieldKey,
    value,
  }));
  if (rows.length) await tx.insert(submissionAnswers).values(rows);
  await tx
    .insert(submissionStatusHistory)
    .values({ submissionId: s.id, status });
  const granted = version.definition.fields
    .filter((field) => field.type === "consent" && answers[field.id] === true)
    .map((field) => ({
      submissionId: s.id,
      purpose: field.purpose!,
      textVersion: field.consentVersion!,
      grantedAt: currentTime,
    }));
  if (granted.length) await tx.insert(consents).values(granted);
  const receipt: Receipt = {
    id: s.id,
    receiptToken,
    status,
    message: full
      ? "Kontenjan dolu. Başvurunuz bekleme listesine alındı."
      : settings.thankYou,
  };
  await tx.insert(idempotencyRecords).values({
    scope,
    keyHash,
    requestHash,
    resourceId: s.id,
    responseEncrypted: encryptReplay(receipt, scope),
    expiresAt: new Date(currentTime.getTime() + 86400000),
  });
  return receipt;
}
