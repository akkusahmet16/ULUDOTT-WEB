import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { getDatabase, closeDatabase } from "../../src/lib/database/client";
import {
  createDraftVersion,
  publishStoredVersion,
  readFormVersion,
} from "../../src/modules/forms/infrastructure/form-repository";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  old: string | undefined,
  formId: string,
  fieldId: string;
beforeEach(async () => {
  local = await createTestDatabase();
  old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  formId = randomUUID();
  fieldId = randomUUID();
  await local.sql`insert into forms(id,title,slug) values(${formId},'Test form',${formId})`;
});
afterEach(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = old;
});
const definition = (id: string, label = "Eski ad") => ({
  fields: [{ id, type: "short_text", label, required: true }],
});
it("v2 etiketi ve yeni alan, v1 yanıtını ve snapshot'ı değiştirmez", async () => {
  const db = getDatabase();
  const v1 = await createDraftVersion(db, formId, definition(fieldId));
  await publishStoredVersion(db, v1.id);
  const sid = randomUUID();
  await local.sql`insert into submissions(id,form_id,version_id,snapshot,receipt_token_hash) values(${sid},${formId},${v1.id},'{}',${randomUUID()})`;
  await local.sql`insert into submission_answers(submission_id,version_id,field_key,value) values(${sid},${v1.id},${fieldId},'"Ada"')`;
  const v2 = await createDraftVersion(db, formId, {
    fields: [
      ...definition(fieldId, "Yeni ad").fields,
      { id: randomUUID(), type: "number", label: "Yeni sayı" },
    ],
  });
  await publishStoredVersion(db, v2.id);
  expect(v2.version).toBe(2);
  expect((await readFormVersion(db, v1.id)).definition.fields[0].label).toBe(
    "Eski ad",
  );
  const [a] =
    await local.sql`select f.label,a.value from submission_answers a join form_fields f on f.version_id=a.version_id and f.field_key=a.field_key where a.submission_id=${sid}`;
  expect(a).toEqual({ label: "Eski ad", value: "Ada" });
  const [form] = await local.sql`select status from forms where id=${formId}`;
  expect(form.status).toBe("draft");
});
it("yayınlı snapshot ve alan/koşul insert/update/delete DB düzeyinde değişmez", async () => {
  const db = getDatabase(),
    child = randomUUID();
  const v = await createDraftVersion(db, formId, {
    fields: [
      { id: fieldId, type: "checkbox", label: "A" },
      {
        id: child,
        type: "short_text",
        label: "B",
        condition: { op: "eq", fieldId, value: true },
      },
    ],
  });
  await publishStoredVersion(db, v.id);
  await expect(
    local.sql`update form_versions set snapshot='{}' where id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`update form_versions set published_at=null where id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`delete from form_versions where id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`update form_fields set label='Değişti' where version_id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`delete from form_fields where version_id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`insert into form_fields(version_id,field_key,type,label,position) values(${v.id},${randomUUID()},'number','Yeni',2)`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`update form_rules set ast='{}' where version_id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`delete from form_rules where version_id=${v.id}`,
  ).rejects.toMatchObject({ code: "23514" });
  await expect(
    local.sql`insert into form_rules(version_id,ast) values(${v.id},'{}')`,
  ).rejects.toMatchObject({ code: "23514" });
});
it("taslak değişebilir, tutarsız alan/snapshot yayınlanamaz, paralel sürümler tekildir", async () => {
  const db = getDatabase();
  const [a, b] = await Promise.all([
    createDraftVersion(db, formId, definition(fieldId)),
    createDraftVersion(db, formId, definition(fieldId)),
  ]);
  expect([a.version, b.version].sort()).toEqual([1, 2]);
  await local.sql`update form_fields set label='Tutarsız' where version_id=${a.id}`;
  await expect(publishStoredVersion(db, a.id)).rejects.toThrow("tutarsız");
  const [v] =
    await local.sql`select published_at from form_versions where id=${a.id}`;
  expect(v.published_at).toBeNull();
  await publishStoredVersion(db, b.id);
  await expect(
    local.sql`update form_fields set version_id=${a.id} where version_id=${b.id}`,
  ).rejects.toMatchObject({ code: "23514" });
});

it("yayın alan değişikliğiyle yarışınca parent kilidi kontrolü tutarlı tutar", async () => {
  const db = getDatabase();
  const v = await createDraftVersion(db, formId, definition(fieldId));
  let locked!: () => void, release!: () => void;
  const parentLocked = new Promise<void>((r) => {
      locked = r;
    }),
    gate = new Promise<void>((r) => {
      release = r;
    });
  const writer = local.sql.begin(async (tx) => {
    await tx`select id from form_versions where id=${v.id} for update`;
    await tx`update form_fields set label='Tutarsız' where version_id=${v.id}`;
    locked();
    await gate;
  });
  await parentLocked;
  const publishing = publishStoredVersion(db, v.id);
  release();
  await writer;
  await expect(publishing).rejects.toThrow("tutarsız");
  const [row] =
    await local.sql`select published_at from form_versions where id=${v.id}`;
  expect(row.published_at).toBeNull();
});

it("yayın kilidi önce alındığında bekleyen alan yazısı sealed sürümü değiştiremez", async () => {
  const v = await createDraftVersion(
    getDatabase(),
    formId,
    definition(fieldId),
  );
  let locked!: () => void, release!: () => void;
  const parentLocked = new Promise<void>((r) => {
      locked = r;
    }),
    gate = new Promise<void>((r) => {
      release = r;
    });
  const publication = local.sql.begin(async (tx) => {
    await tx`update form_versions set published_at=now() where id=${v.id}`;
    locked();
    await gate;
  });
  await parentLocked;
  const write = local.sql`update form_fields set label='Kaçak' where version_id=${v.id}`;
  const rejected = expect(write).rejects.toMatchObject({ code: "23514" });
  release();
  await publication;
  await rejected;
  const [field] =
    await local.sql`select label from form_fields where version_id=${v.id}`;
  expect(field.label).toBe("Eski ad");
});
