import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { createDraftForm, saveDraftForm, publishForm } from "../../src/modules/forms/application/form-service";
import { submitForm } from "../../src/modules/forms/application/submit-form";
import { getSubmission, getSubmissionFile, deleteSubmission } from "../../src/modules/forms/application/submission-admin";

it("stores a form file privately and permits only a scoped admin to download it", async () => {
  const local = await createTestDatabase();
  const old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  try {
    await migrateEmptyDatabase();
    const eventId = randomUUID(), adminId = randomUUID();
    await local.sql`insert into events(id,title,slug,kind,starts_at,location,status) values(${eventId},'Dosya testi',${eventId},'general','2030-01-01','Yerel','published')`;
    await local.sql`insert into admins(id,email,password_hash) values(${adminId},${adminId + '@test.invalid'},'unused')`;
    const actor = { adminId, roles: ["event_manager"], eventScopes: [eventId] };
    const draft = await createDraftForm(actor, eventId, { title: "Portfolyo", slug: "portfolyo-" + randomUUID(),
      opensAt: "2020-01-01T00:00:00Z", closesAt: null, capacity: null,
      waitlist: false, duplicatePolicy: "reject", thankYou: "Alındı", retentionDays: 30 });
    const emailId = randomUUID(), fileId = randomUUID();
    await saveDraftForm(actor, draft.id, { schemaVersion: 1, fields: [
      { id: emailId, type: "email", label: "E-posta", required: true },
      { id: fileId, type: "file", label: "Portfolyo", required: true },
    ] }, 1);
    await publishForm(actor, draft.id, 2);
    const [version] = await local.sql`select current_version_id from forms where id=${draft.id}`;
    const bytes = Buffer.from("%PDF-1.7\nDemo file\n%%EOF");
    const file = new File([bytes], "portfolyo.pdf", { type: "application/pdf" });
    const [form] = await local.sql`select slug from forms where id=${draft.id}`;
    const submitted = await submitForm(form.slug, { [emailId]: "person@test.invalid" }, randomUUID(), {
      versionId: version.current_version_id, files: new Map([[fileId, file]]),
    });
    const detail = await getSubmission(actor, submitted.id);
    expect(detail.files).toHaveLength(1);
    expect(detail.answers[fileId]).toBe("portfolyo.pdf");
    const downloaded = await getSubmissionFile(actor, submitted.id, detail.files[0].id);
    expect(downloaded.bytes).toEqual(bytes);
    await expect(getSubmissionFile({ ...actor, eventScopes: [] }, submitted.id, detail.files[0].id)).rejects.toThrow();
    await deleteSubmission(actor, submitted.id, detail.revision);
    const [count] = await local.sql`select count(*)::int n from submission_files`;
    expect(count.n).toBe(0);
  } finally {
    await closeDatabase();
    await local.cleanup();
    process.env.DATABASE_URL = old;
  }
});
