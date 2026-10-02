import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { DbTx } from "../../../lib/database/transaction.ts";
import type { Database } from "../../../lib/database/client.ts";
import {
  forms,
  formVersions,
  formFields,
  formRules,
} from "../../../db/schema/forms.ts";
import {
  validateFormDefinition,
  type ValidFormDefinition,
  type FormVersion,
} from "../domain/form-version.ts";
function fieldRows(d: ValidFormDefinition, versionId: string) {
  return d.fields.map((field, position) => ({
    versionId,
    fieldKey: field.id,
    type: field.type,
    label: field.label,
    position,
    config: Object.fromEntries(
      Object.entries(field).filter(
        ([key]) => !["id", "type", "label", "condition"].includes(key),
      ),
    ),
  }));
}
function ruleRows(d: ValidFormDefinition, versionId: string) {
  return d.fields
    .filter((f) => f.condition)
    .map((f) => ({
      versionId,
      ast: { fieldId: f.id, condition: f.condition },
    }));
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => JSON.stringify(k) + ":" + canonical(x))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
function version(row: typeof formVersions.$inferSelect): FormVersion {
  return {
    id: row.id,
    formId: row.formId,
    version: row.version,
    definition: validateFormDefinition(row.snapshot),
    publishedAt: row.publishedAt,
  };
}
// Internal repository only. Actor permissions and audit are bound by the task 11 service.
export async function createDraftVersion(
  db: Database | DbTx,
  formId: string,
  input: unknown,
): Promise<FormVersion> {
  z.uuid().parse(formId);
  const d = validateFormDefinition(input);
  return db.transaction(async (tx) => {
    const [form] = await tx
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .for("update");
    if (!form) throw Error("Form bulunamadı");
    const [latest] = await tx
      .select({ n: sql<number>`coalesce(max(${formVersions.version}),0)::int` })
      .from(formVersions)
      .where(eq(formVersions.formId, formId));
    const [row] = await tx
      .insert(formVersions)
      .values({ formId, version: latest.n + 1, snapshot: d })
      .returning();
    await tx.insert(formFields).values(fieldRows(d, row.id));
    const rules = ruleRows(d, row.id);
    if (rules.length) await tx.insert(formRules).values(rules);
    return version(row);
  });
}
export async function publishStoredVersion(
  db: Database | DbTx,
  id: string,
): Promise<FormVersion> {
  z.uuid().parse(id);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(formVersions)
      .where(eq(formVersions.id, id))
      .for("update");
    if (!row) throw Error("Form sürümü bulunamadı");
    if (row.publishedAt) throw Error("Form sürümü zaten yayımlandı");
    const d = validateFormDefinition(row.snapshot);
    const storedFields = await tx
      .select()
      .from(formFields)
      .where(eq(formFields.versionId, id))
      .orderBy(formFields.position);
    const storedRules = await tx
      .select({ ast: formRules.ast })
      .from(formRules)
      .where(eq(formRules.versionId, id));
    if (
      canonical(storedFields) !== canonical(fieldRows(d, id)) ||
      canonical(
        storedRules
          .map((r) => r.ast)
          .sort((a, b) => canonical(a).localeCompare(canonical(b))),
      ) !==
        canonical(
          ruleRows(d, id)
            .map((r) => r.ast)
            .sort((a, b) => canonical(a).localeCompare(canonical(b))),
        )
    )
      throw Error("Form sürümü alanları tutarsız");
    const [published] = await tx
      .update(formVersions)
      .set({ publishedAt: new Date() })
      .where(
        and(eq(formVersions.id, id), sql`${formVersions.publishedAt} is null`),
      )
      .returning();
    return version(published);
  });
}
export async function readFormVersion(
  db: Database | DbTx,
  id: string,
): Promise<FormVersion> {
  z.uuid().parse(id);
  const [row] = await db
    .select()
    .from(formVersions)
    .where(eq(formVersions.id, id));
  if (!row) throw Error("Form sürümü bulunamadı");
  return version(row);
}
