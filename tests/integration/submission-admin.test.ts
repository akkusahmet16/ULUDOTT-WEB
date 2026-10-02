import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
  getForm,
} from "../../src/modules/forms/application/form-service";
import { submitForm } from "../../src/modules/forms/application/submit-form";
import { getReceipt } from "../../src/modules/forms/application/receipt-service";
import {
  listSubmissions,
  getSubmission,
  changeSubmissionStatus,
  correctSubmission,
  deleteSubmission,
  purgeExpiredSubmissions,
} from "../../src/modules/forms/application/submission-admin";
import { exportSubmissions } from "../../src/modules/forms/application/export-submissions";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  old: string | undefined,
  formId: string,
  eventId: string,
  fieldId: string,
  receipt: Awaited<ReturnType<typeof submitForm>>;
const actor = {
  adminId: randomUUID(),
  roles: ["event_manager"],
  eventScopes: [] as string[],
};
beforeEach(async () => {
  local = await createTestDatabase();
  old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  eventId = randomUUID();
  fieldId = randomUUID();
  actor.eventScopes = [eventId];
  await local.sql`insert into events(id,title,slug,kind) values(${eventId},'Test',${eventId},'general')`;
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'admin-sub@test.invalid','not-login')`;
  const f = await createDraftForm(actor, eventId, {
    title: "Test",
    slug: "admin-test",
    opensAt: "2020-01-01T00:00:00Z",
    closesAt: null,
    capacity: 2,
    waitlist: true,
    duplicatePolicy: "allow",
    thankYou: "Teşekkürler",
    retentionDays: 1,
  });
  formId = f.id;
  await saveDraftForm(
    actor,
    formId,
    {
      fields: [
        { id: fieldId, type: "short_text", label: "Eski ad", required: true },
      ],
    },
    1,
  );
  await publishForm(actor, formId, 2);
  receipt = await submitForm(
    "admin-test",
    { [fieldId]: "=HYPERLINK(test)" },
    randomUUID(),
    {},
  );
});
afterEach(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = old;
});
it("scoped yetki, liste minimizasyonu ve export audit", async () => {
  for (const other of [
    { ...actor, eventScopes: [] },
    { ...actor, roles: ["content_editor"] },
    { ...actor, roles: ["system_admin"] },
  ]) {
    await expect(listSubmissions(other, formId, null, {})).rejects.toThrow(
      "Yetki yok",
    );
    await expect(getSubmission(other, receipt.id)).rejects.toThrow("Yetki yok");
    await expect(exportSubmissions(other, formId, "csv")).rejects.toThrow(
      "Yetki yok",
    );
  }
  const list = await listSubmissions(actor, formId, null, {});
  expect(list.items).toHaveLength(1);
  expect(list.items[0]).not.toHaveProperty("answers");
  expect(list.items[0]).not.toHaveProperty("receiptTokenHash");
  const csv = await exportSubmissions(actor, formId, "csv");
  expect(Buffer.from(csv.data).toString("utf8")).toContain("'=HYPERLINK(test)");
  const [audit] =
    await local.sql`select changes from audit_logs where action='submission.exported'`;
  expect(audit.changes).not.toHaveProperty("answers");
});
it("büyük liste cursor, filtre ve farklı sürüm etiketleri", async () => {
  const f = await getForm(actor, formId),
    version = f.current!.id;
  await local.sql`insert into submissions(form_id,version_id,event_id,snapshot,receipt_token_hash) select ${formId},${version},${eventId},'{"formTitle":"Test","thankYou":"Test"}',md5(random()::text || n::text) from generate_series(1,205) n`;
  let cursor: string | null = null;
  const ids = new Set<string>();
  do {
    const page = await listSubmissions(actor, formId, cursor, { limit: 100 });
    for (const r of page.items) {
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);
    }
    cursor = page.nextCursor;
  } while (cursor);
  expect(ids.size).toBe(206);
  expect(
    (await listSubmissions(actor, formId, null, { q: "HYPERLINK" })).items,
  ).toHaveLength(1);
  expect(
    (await listSubmissions(actor, formId, null, { status: "approved" })).items,
  ).toHaveLength(0);
  await saveDraftForm(
    actor,
    formId,
    {
      fields: [
        { id: fieldId, type: "short_text", label: "Yeni ad", required: true },
      ],
    },
    f.revision,
  );
  const draft = await getForm(actor, formId);
  await publishForm(actor, formId, draft.revision);
  const newer = await submitForm(
    "admin-test",
    { [fieldId]: "Yeni" },
    randomUUID(),
    {},
  );
  expect(
    (await getSubmission(actor, receipt.id)).version.definition.fields[0].label,
  ).toBe("Eski ad");
  expect(
    (await getSubmission(actor, newer.id)).version.definition.fields[0].label,
  ).toBe("Yeni ad");
});
it("durum geçmişi, revision ve waitlist kabul kapasitesi", async () => {
  await changeSubmissionStatus(actor, receipt.id, "pending", 1);
  await expect(
    changeSubmissionStatus(actor, receipt.id, "approved", 1),
  ).rejects.toThrow("Sürüm çakışması");
  await changeSubmissionStatus(actor, receipt.id, "approved", 2);
  await submitForm("admin-test", { [fieldId]: "İkinci" }, randomUUID(), {});
  const wait = await submitForm(
    "admin-test",
    { [fieldId]: "Üçüncü" },
    randomUUID(),
    {},
  );
  expect(wait.status).toBe("waitlisted");
  await expect(
    changeSubmissionStatus(actor, wait.id, "received", 1),
  ).rejects.toThrow("Kontenjan");
  expect(
    (await getSubmission(actor, receipt.id)).history.map(
      (r: { status: string }) => r.status,
    ),
  ).toEqual(["received", "pending", "approved"]);
});
it("düzeltme eski sürümde doğrulanır; silme receipt/replay/answers iptal eder", async () => {
  await correctSubmission(actor, receipt.id, { [fieldId]: "Düzeltilmiş" }, 1);
  expect((await getSubmission(actor, receipt.id)).answers[fieldId]).toBe(
    "Düzeltilmiş",
  );
  await expect(
    correctSubmission(actor, receipt.id, { [fieldId]: 123 }, 2),
  ).rejects.toThrow();
  await deleteSubmission(actor, receipt.id, 2);
  await expect(getReceipt(receipt.receiptToken)).rejects.toThrow();
  const [n] =
    await local.sql`select (select count(*)::int from submissions) as s,(select count(*)::int from submission_answers) as a,(select count(*)::int from idempotency_records) as i`;
  expect(n).toEqual({ s: 0, a: 0, i: 0 });
});
it("expiry admin okumayı kapatır ve scoped purge temizler", async () => {
  await local.sql`update submissions set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=${receipt.id}`;
  expect((await listSubmissions(actor, formId, null, {})).items).toHaveLength(
    0,
  );
  await expect(getSubmission(actor, receipt.id)).rejects.toThrow();
  await expect(
    purgeExpiredSubmissions({ ...actor, eventScopes: [] }, formId),
  ).rejects.toThrow("Yetki yok");
  expect((await purgeExpiredSubmissions(actor, formId)).deleted).toBe(1);
  await expect(getReceipt(receipt.receiptToken)).rejects.toThrow();
});
