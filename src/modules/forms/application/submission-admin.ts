import "server-only";
import { and, eq, ne, inArray, desc, asc, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  forms,
  submissions,
  submissionAnswers,
  submissionFiles,
  submissionStatusHistory,
  consents,
} from "../../../db/schema/forms.ts";
import {
  applications,
  applicationSkills,
  memberships,
  teams,
  teamAccess,
  teamApprovals,
  teamSessions,
} from "../../../db/schema/ulujam.ts";
import {
  cards,
  walletPasses,
  appleRegistrations,
} from "../../../db/schema/wallet.ts";
import { games, gameCredits } from "../../../db/schema/content.ts";
import { idempotencyRecords } from "../../../db/schema/operations.ts";
import { readFormVersion } from "../infrastructure/form-repository.ts";
import { validateSubmission } from "./form-validator.ts";
import { settingsSchema } from "../domain/form-settings.ts";
import { emailIdentity } from "../domain/email-identity.ts";
import type { Answers } from "../domain/field-types.ts";
import { removePrivate, readPrivate } from "../../media/infrastructure/object-store.ts";
export const statusSchema = z.enum([
  "received",
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "waitlisted",
]);
export type SubmissionStatus = z.infer<typeof statusSchema>;
export const filterSchema = z
  .strictObject({
    limit: z.int().min(1).max(100).default(25),
    q: z.string().trim().max(100).optional(),
    status: statusSchema.optional(),
    versionId: z.uuid().optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, "Tarih aralığı geçersiz");
export async function scopedForm(
  tx: DbTx,
  actor: Actor,
  id: string,
  permission: string,
) {
  z.uuid().parse(id);
  const [f] = await tx
    .select()
    .from(forms)
    .where(eq(forms.id, id))
    .for("update");
  if (!f) throw Error("Form bulunamadı");
  requirePermission(actor, permission, f.eventId ?? undefined);
  await tx.execute(sql`set local statement_timeout = '5s'`);
  return f;
}
export function submissionFilter(formId: string, input: unknown): SQL {
  const d = filterSchema.parse(input),
    clauses: SQL[] = [
      eq(submissions.formId, formId),
      sql`${submissions.expiresAt}>now()`,
    ];
  if (d.status) clauses.push(eq(submissions.status, d.status));
  if (d.versionId) clauses.push(eq(submissions.versionId, d.versionId));
  if (d.from)
    clauses.push(sql`${submissions.createdAt}>=${d.from}::timestamptz`);
  if (d.to) clauses.push(sql`${submissions.createdAt}<=${d.to}::timestamptz`);
  if (d.q) {
    const pattern = "%" + d.q.replace(/[\\%_]/g, "\\$&") + "%";
    clauses.push(
      sql`(${submissions.email} ilike ${pattern} or exists(select 1 from ${submissionAnswers} where ${submissionAnswers.submissionId}=${submissions.id} and ${submissionAnswers.value}::text ilike ${pattern}))`,
    );
  }
  return and(...clauses)!;
}
export const summaryColumns = {
  id: submissions.id,
  email: submissions.email,
  status: submissions.status,
  revision: submissions.revision,
  versionId: submissions.versionId,
  createdAt: sql<string>`to_char(${submissions.createdAt} at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  expiresAt: submissions.expiresAt,
};
const cursorSchema = z.strictObject({
  formId: z.uuid(),
  id: z.uuid(),
  createdAt: z.iso.datetime({ precision: 6 }),
});
export async function listSubmissions(
  actor: Actor,
  formId: string,
  cursor: string | null = null,
  filters: unknown = {},
) {
  const d = filterSchema.parse(filters);
  return withTransaction(async (tx) => {
    await scopedForm(tx, actor, formId, "applications.read");
    let where = submissionFilter(formId, d);
    if (cursor) {
      if (cursor.length > 500) throw Error("Geçersiz sayfa");
      let c;
      try {
        c = cursorSchema.parse(
          JSON.parse(Buffer.from(cursor, "base64url").toString()),
        );
      } catch {
        throw Error("Geçersiz sayfa");
      }
      if (c.formId !== formId) throw Error("Geçersiz sayfa");
      where = and(
        where,
        sql`(${submissions.createdAt}<${c.createdAt}::timestamptz or (${submissions.createdAt}=${c.createdAt}::timestamptz and ${submissions.id}<${c.id}::uuid))`,
      )!;
    }
    const rows = await tx
      .select(summaryColumns)
      .from(submissions)
      .where(where)
      .orderBy(desc(submissions.createdAt), desc(submissions.id))
      .limit(d.limit + 1);
    const items = rows.slice(0, d.limit),
      last = items.at(-1);
    const itemIds = items.map((r) => r.id);
    const fileRows = itemIds.length
      ? await tx
          .select({
            id: submissionFiles.id,
            submissionId: submissionFiles.submissionId,
            fieldKey: submissionFiles.fieldKey,
            fileName: submissionFiles.fileName,
            mimeType: submissionFiles.mimeType,
            byteSize: submissionFiles.byteSize,
          })
          .from(submissionFiles)
          .where(inArray(submissionFiles.submissionId, itemIds))
      : [];
    const filesBySubmission = new Map<
      string,
      {
        id: string;
        fieldKey: string;
        fileName: string;
        mimeType: string;
        byteSize: number;
      }[]
    >();
    for (const file of fileRows) {
      const list = filesBySubmission.get(file.submissionId) ?? [];
      list.push({
        id: file.id,
        fieldKey: file.fieldKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        byteSize: file.byteSize,
      });
      filesBySubmission.set(file.submissionId, list);
    }
    const enrichedItems = items.map((item) => ({
      ...item,
      files: filesBySubmission.get(item.id) ?? [],
    }));
    const nextCursor =
      rows.length > d.limit && last
        ? Buffer.from(
            JSON.stringify({ formId, id: last.id, createdAt: last.createdAt }),
          ).toString("base64url")
        : null;
    return { items: enrichedItems, nextCursor };
  });
}
async function locked(
  tx: DbTx,
  actor: Actor,
  id: string,
  permission: string,
  revision?: number,
) {
  z.uuid().parse(id);
  const [ref] = await tx
    .select({ formId: submissions.formId })
    .from(submissions)
    .where(eq(submissions.id, id));
  if (!ref) throw Error("Başvuru bulunamadı");
  const form = await scopedForm(tx, actor, ref.formId, permission);
  const [s] = await tx
    .select()
    .from(submissions)
    .where(and(eq(submissions.id, id), sql`${submissions.expiresAt}>now()`))
    .for("update");
  if (!s) throw Error("Başvuru bulunamadı");
  if (
    revision !== undefined &&
    s.revision !== z.int().positive().parse(revision)
  )
    throw Error("Sürüm çakışması");
  return { s, form };
}
export async function getSubmission(actor: Actor, id: string) {
  return withTransaction(async (tx) => {
    const { s } = await locked(tx, actor, id, "applications.read");
    const version = await readFormVersion(tx, s.versionId);
    const rows = await tx
      .select({
        fieldKey: submissionAnswers.fieldKey,
        value: submissionAnswers.value,
      })
      .from(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, id));
    const history = await tx
      .select({
        status: submissionStatusHistory.status,
        createdAt: submissionStatusHistory.createdAt,
      })
      .from(submissionStatusHistory)
      .where(eq(submissionStatusHistory.submissionId, id))
      .orderBy(
        asc(submissionStatusHistory.createdAt),
        asc(submissionStatusHistory.id),
      );
    const consentRows = await tx
      .select({
        purpose: consents.purpose,
        textVersion: consents.textVersion,
        grantedAt: consents.grantedAt,
        withdrawnAt: consents.withdrawnAt,
      })
      .from(consents)
      .where(eq(consents.submissionId, id));
    const files = await tx.select({ id: submissionFiles.id, fieldKey: submissionFiles.fieldKey,
      fileName: submissionFiles.fileName, mimeType: submissionFiles.mimeType,
      byteSize: submissionFiles.byteSize }).from(submissionFiles)
      .where(eq(submissionFiles.submissionId, id));
    return {
      id: s.id,
      formId: s.formId,
      eventId: s.eventId,
      email: s.email,
      status: s.status,
      revision: s.revision,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      version,
      answers: Object.fromEntries(
        rows.map((r) => [r.fieldKey, r.value]),
      ) as Answers,
      history,
      consents: consentRows,
      files,
    };
  });
}
export async function getSubmissionFile(actor: Actor, submissionId: string, fileId: string) {
  return withTransaction(async (tx) => {
    await locked(tx, actor, submissionId, "applications.read");
    const [file] = await tx.select().from(submissionFiles).where(and(
      eq(submissionFiles.id, z.uuid().parse(fileId)),
      eq(submissionFiles.submissionId, submissionId),
    ));
    if (!file) throw Error("Dosya bulunamadı");
    return { bytes: await readPrivate(file.objectKey), name: file.fileName, mime: file.mimeType };
  });
}
const transitions: Record<string, SubmissionStatus[]> = {
  received: ["pending", "approved", "rejected", "withdrawn"],
  pending: ["approved", "rejected", "withdrawn"],
  approved: ["pending", "rejected", "withdrawn"],
  waitlisted: ["received", "rejected", "withdrawn"],
  rejected: ["pending", "withdrawn"],
  withdrawn: [],
};
const counted = ["received", "pending", "approved"];
export async function changeSubmissionStatus(
  actor: Actor,
  id: string,
  status: unknown,
  revision?: number,
) {
  const target = statusSchema.parse(status);
  return withTransaction(async (tx) => {
    const { s, form } = await locked(
      tx,
      actor,
      id,
      "applications.write",
      revision,
    );
    if (!transitions[s.status]?.includes(target))
      throw Error("Durum geçişi geçersiz");
    if (
      form.capacity &&
      counted.includes(target) &&
      !counted.includes(s.status)
    ) {
      const [n] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(submissions)
        .where(
          and(
            eq(submissions.formId, s.formId),
            inArray(submissions.status, counted),
            sql`${submissions.expiresAt}>now()`,
          ),
        );
      if (n.count >= form.capacity) throw Error("Kontenjan dolu");
    }
    await tx
      .update(submissions)
      .set({ status: target, revision: s.revision + 1 })
      .where(eq(submissions.id, id));
    await tx
      .insert(submissionStatusHistory)
      .values({ submissionId: id, status: target });
    if (target === "withdrawn")
      await tx
        .update(consents)
        .set({ withdrawnAt: sql`now()` })
        .where(
          and(
            eq(consents.submissionId, id),
            sql`${consents.withdrawnAt} is null`,
          ),
        );
    await appendAudit(
      tx,
      actor,
      "submission.status",
      { type: "submission", id },
      { status: target, revision: s.revision + 1 },
    );
    return { id, revision: s.revision + 1 };
  });
}
export async function correctSubmission(
  actor: Actor,
  id: string,
  input: unknown,
  revision: number,
  existingTx?: DbTx,
) {
  const work = async (tx: DbTx) => {
    const { s, form } = await locked(
        tx,
        actor,
        id,
        "applications.write",
        revision,
      ),
      version = await readFormVersion(tx, s.versionId),
      answers = validateSubmission(version, input);
    const old = await tx
      .select()
      .from(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, id));
    for (const f of version.definition.fields.filter(
      (f) => f.type === "consent",
    ))
      if (answers[f.id] !== old.find((r) => r.fieldKey === f.id)?.value)
        throw Error("Rıza yönetici tarafından değiştirilemez");
    const identity = emailIdentity(version.definition),
      email =
        identity && typeof answers[identity.id] === "string"
          ? String(answers[identity.id]).trim().toLowerCase()
          : null;
    if (
      email &&
      settingsSchema.parse(form.settings).duplicatePolicy === "reject"
    ) {
      const [duplicate] = await tx
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(
            eq(submissions.formId, s.formId),
            eq(submissions.email, email),
            ne(submissions.id, id),
            sql`${submissions.expiresAt}>now()`,
          ),
        )
        .limit(1);
      if (duplicate) throw Error("Bu e-posta ile başvuru mevcut");
    }
    await tx
      .delete(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, id));
    if (Object.keys(answers).length)
      await tx.insert(submissionAnswers).values(
        Object.entries(answers).map(([fieldKey, value]) => ({
          submissionId: id,
          versionId: s.versionId,
          fieldKey,
          value,
        })),
      );
    await tx
      .update(submissions)
      .set({ email, revision: s.revision + 1 })
      .where(eq(submissions.id, id));
    await appendAudit(
      tx,
      actor,
      "submission.corrected",
      { type: "submission", id },
      { revision: s.revision + 1, changedFields: ["formVersion", "email"] },
    );
    return { id, revision: s.revision + 1 };
  };
  return existingTx ? work(existingTx) : withTransaction(work);
}
async function erase(tx: DbTx, id: string) {
  const appRows = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.submissionId, id));
  const appIds = appRows.map((a) => a.id);
  if (appIds.length > 0) {
    const cardRows = await tx
      .select({ id: cards.id })
      .from(cards)
      .where(inArray(cards.applicationId, appIds));
    const cardIds = cardRows.map((c) => c.id);
    if (cardIds.length > 0) {
      const passRows = await tx
        .select({ id: walletPasses.id })
        .from(walletPasses)
        .where(inArray(walletPasses.cardId, cardIds));
      const passIds = passRows.map((p) => p.id);
      if (passIds.length > 0) {
        await tx
          .delete(appleRegistrations)
          .where(inArray(appleRegistrations.passId, passIds));
        await tx.delete(walletPasses).where(inArray(walletPasses.id, passIds));
      }
      await tx.delete(cards).where(inArray(cards.id, cardIds));
    }
    const memberTeams = await tx
      .select({ teamId: memberships.teamId })
      .from(memberships)
      .where(inArray(memberships.applicationId, appIds));
    const teamIds = [...new Set(memberTeams.map((m) => m.teamId))];
    await tx
      .delete(memberships)
      .where(inArray(memberships.applicationId, appIds));
    await tx
      .delete(applicationSkills)
      .where(inArray(applicationSkills.applicationId, appIds));
    await tx
      .update(gameCredits)
      .set({ applicationId: null })
      .where(inArray(gameCredits.applicationId, appIds));
    await tx.delete(applications).where(inArray(applications.id, appIds));
    for (const teamId of teamIds) {
      const remaining = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .where(eq(memberships.teamId, teamId))
        .limit(1);
      if (remaining.length === 0) {
        await tx
          .update(games)
          .set({ teamId: null })
          .where(eq(games.teamId, teamId));
        await tx.delete(teamSessions).where(eq(teamSessions.teamId, teamId));
        await tx.delete(teamAccess).where(eq(teamAccess.teamId, teamId));
        await tx.delete(teamApprovals).where(eq(teamApprovals.teamId, teamId));
        await tx.delete(teams).where(eq(teams.id, teamId));
      }
    }
  }
  const files = await tx.select({ objectKey: submissionFiles.objectKey }).from(submissionFiles)
    .where(eq(submissionFiles.submissionId, id));
  await tx.delete(submissionFiles).where(eq(submissionFiles.submissionId, id));
  await tx
    .delete(idempotencyRecords)
    .where(eq(idempotencyRecords.resourceId, id));
  await tx
    .delete(submissionAnswers)
    .where(eq(submissionAnswers.submissionId, id));
  await tx.delete(consents).where(eq(consents.submissionId, id));
  await tx
    .delete(submissionStatusHistory)
    .where(eq(submissionStatusHistory.submissionId, id));
  await tx.delete(submissions).where(eq(submissions.id, id));
  return files.map((file) => file.objectKey);
}
export async function deleteSubmission(
  actor: Actor,
  id: string,
  revision: number,
) {
  const keys = await withTransaction(async (tx) => {
    await locked(tx, actor, id, "applications.write", revision);
    const removed = await erase(tx, id);
    await appendAudit(
      tx,
      actor,
      "submission.deleted",
      { type: "submission", id },
      { revision },
    );
    return removed;
  });
  await Promise.allSettled(keys.map(removePrivate));
  return { deleted: true };
}
export async function purgeExpiredSubmissions(actor: Actor, formId: string) {
  const result = await withTransaction(async (tx) => {
    await scopedForm(tx, actor, formId, "applications.write");
    const rows = await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.formId, formId),
          sql`${submissions.expiresAt}<=now()`,
        ),
      )
      .orderBy(asc(submissions.expiresAt), asc(submissions.id))
      .limit(1000)
      .for("update");
    const keys: string[] = [];
    let deleted = 0;
    const blocked = 0;
    for (const s of rows) {
      keys.push(...await erase(tx, s.id));
      deleted++;
    }
    await appendAudit(
      tx,
      actor,
      "submission.retention",
      { type: "form", id: formId },
      { recordCount: deleted },
    );
    return { deleted, blocked, keys };
  });
  await Promise.allSettled(result.keys.map(removePrivate));
  return { deleted: result.deleted, blocked: result.blocked };
}
