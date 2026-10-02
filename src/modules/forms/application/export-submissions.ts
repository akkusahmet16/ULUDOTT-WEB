import "server-only";
import ExcelJS from "exceljs";
import { inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { submissions, submissionAnswers } from "../../../db/schema/forms.ts";
import { readFormVersion } from "../infrastructure/form-repository.ts";
import {
  scopedForm,
  submissionFilter,
  summaryColumns,
} from "./submission-admin.ts";
export function safeCell(input: unknown): string {
  const text = Array.isArray(input)
    ? input.join(", ")
    : input === null || input === undefined
      ? ""
      : String(input);
  const normalized = text.normalize("NFKC").replace(/^[\s\p{Cf}]+/u, "");
  return /^[=+\-@]/.test(normalized) || /^[\t\r\n]/.test(text)
    ? "'" + text
    : text;
}
export async function serializeExport(
  rows: unknown[][],
  format: "csv" | "xlsx",
): Promise<Buffer> {
  z.enum(["csv", "xlsx"]).parse(format);
  if (
    rows.length > 5001 ||
    rows.some((r) => r.length > 1006) ||
    rows.reduce((n, r) => n + r.length, 0) > 250000
  )
    throw Error("Dışa aktarma sınırı aşıldı; filtreleri daraltın");
  const safe = rows.map((r) => r.map(safeCell));
  let data: Buffer;
  if (format === "csv")
    data = Buffer.from(
      "\uFEFF" +
        safe
          .map((r) =>
            r.map((v) => '"' + v.replaceAll('"', '""') + '"').join(","),
          )
          .join("\r\n"),
      "utf8",
    );
  else {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Başvurular");
    for (const r of safe) sheet.addRow(r);
    data = Buffer.from(await workbook.xlsx.writeBuffer());
  }
  if (data.length > 20 * 1024 * 1024)
    throw Error("Dışa aktarma sınırı aşıldı; filtreleri daraltın");
  return data;
}
export async function exportSubmissions(
  actor: Actor,
  formId: string,
  format: "csv" | "xlsx",
  filters: unknown = {},
) {
  z.enum(["csv", "xlsx"]).parse(format);
  return withTransaction(async (tx) => {
    await scopedForm(tx, actor, formId, "applications.export");
    const rows = await tx
      .select(summaryColumns)
      .from(submissions)
      .where(submissionFilter(formId, filters))
      .orderBy(desc(submissions.createdAt), desc(submissions.id))
      .limit(5001);
    if (rows.length > 5000)
      throw Error("Dışa aktarma sınırı aşıldı; filtreleri daraltın");
    const versions = await Promise.all(
      [...new Set(rows.map((r) => r.versionId))].map((id) =>
        readFormVersion(tx, id),
      ),
    );
    const columns = versions
      .sort((a, b) => a.version - b.version)
      .flatMap((v) =>
        v.definition.fields
          .filter((f) => !["info", "section"].includes(f.type))
          .map((f) => ({
            versionId: v.id,
            fieldKey: f.id,
            label: `v${v.version} / ${f.label}`,
          })),
      );
    if (
      columns.length > 1000 ||
      (rows.length + 1) * (columns.length + 5) > 250000
    )
      throw Error("Dışa aktarma sınırı aşıldı; filtreleri daraltın");
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      const [bytes] = await tx
        .select({
          size: sql<string>`coalesce(sum(octet_length(${submissionAnswers.value}::text)),0)::text`,
        })
        .from(submissionAnswers)
        .where(inArray(submissionAnswers.submissionId, ids));
      if (Number(bytes.size) > 10 * 1024 * 1024)
        throw Error("Dışa aktarma sınırı aşıldı; filtreleri daraltın");
    }
    const answers = ids.length
      ? await tx
          .select()
          .from(submissionAnswers)
          .where(inArray(submissionAnswers.submissionId, ids))
      : [];
    const byKey = new Map(
      answers.map((a) => [a.submissionId + ":" + a.fieldKey, a.value]),
    );
    const matrix: unknown[][] = [
      [
        "Başvuru",
        "E-posta",
        "Durum",
        "Tarih",
        "Saklama sonu",
        ...columns.map((c) => c.label),
      ],
      ...rows.map((r) => [
        r.id,
        r.email,
        r.status,
        r.createdAt,
        r.expiresAt.toISOString(),
        ...columns.map((c) =>
          c.versionId === r.versionId ? byKey.get(r.id + ":" + c.fieldKey) : "",
        ),
      ]),
    ];
    const data = await serializeExport(matrix, format);
    await appendAudit(
      tx,
      actor,
      "submission.exported",
      { type: "form", id: formId },
      { recordCount: rows.length, format },
    );
    return {
      data,
      filename: `basvurular-${formId}.${format}`,
      contentType:
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });
}
