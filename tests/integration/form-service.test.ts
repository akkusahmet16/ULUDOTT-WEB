import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
  pauseForm,
  closeForm,
  deleteForm,
  listForms,
  getForm,
  saveFormSettings,
} from "../../src/modules/forms/application/form-service";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { ulujamFields as uf } from "../../src/modules/applications/domain/ulujam-input";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  old: string | undefined,
  eventId: string;
const actor = {
  adminId: randomUUID(),
  roles: ["event_manager"],
  eventScopes: [] as string[],
};
const settings = {
  title: "Test form",
  slug: "test-form",
  opensAt: "2020-01-01T00:00:00Z",
  closesAt: null,
  capacity: 2,
  waitlist: true,
  duplicatePolicy: "allow",
  thankYou: "Teşekkürler",
  retentionDays: 180,
};
beforeEach(async () => {
  local = await createTestDatabase();
  old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  eventId = randomUUID();
  actor.eventScopes = [eventId];
  await local.sql`insert into events(id,title,slug,kind) values(${eventId},'Test',${eventId},'general')`;
  await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'forms@test.invalid','not-login')`;
});
afterEach(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = old;
});
it("kapsamlı yetki, zorunlu ayar ve tarih penceresi sunucuda denetlenir", async () => {
  for (const roles of [["content_editor"], ["system_admin"]])
    await expect(
      createDraftForm({ ...actor, roles }, eventId, settings),
    ).rejects.toThrow("Yetki yok");
  await expect(
    createDraftForm({ ...actor, eventScopes: [] }, eventId, settings),
  ).rejects.toThrow("Yetki yok");
  await expect(
    createDraftForm(actor, eventId, { ...settings, thankYou: "" }),
  ).rejects.toThrow();
  await expect(
    createDraftForm(actor, eventId, {
      ...settings,
      closesAt: "2019-01-01T00:00:00Z",
    }),
  ).rejects.toThrow();
});
it("taslak önizleme, optimistic revision, yeni sürüm ve pause/close çalışır", async () => {
  const created = (await createDraftForm(actor, eventId, settings)) as {
    id: string;
  };
  let f = await getForm(actor, created.id);
  expect(f.status).toBe("draft");
  const fieldId = randomUUID();
  await saveDraftForm(
    actor,
    f.id,
    {
      fields: [
        {
          id: fieldId,
          type: "short_text",
          label: "Ad",
          helpText: "Gerçek ad",
          required: true,
        },
      ],
    },
    f.revision,
  );
  f = await getForm(actor, f.id);
  expect(f.draft!.definition.fields[0].helpText).toBe("Gerçek ad");
  await expect(publishForm(actor, f.id, 1)).rejects.toThrow("Sürüm çakışması");
  await publishForm(actor, f.id, f.revision);
  f = await getForm(actor, f.id);
  expect(f.status).toBe("published");
  const v1 = f.current!.id;
  await saveDraftForm(
    actor,
    f.id,
    { fields: [{ id: fieldId, type: "short_text", label: "Yeni ad" }] },
    f.revision,
  );
  f = await getForm(actor, f.id);
  expect(f.current!.id).toBe(v1);
  expect(f.draft!.version).toBe(2);
  await publishForm(actor, f.id, f.revision);
  f = await getForm(actor, f.id);
  expect(f.current!.id).not.toBe(v1);
  await pauseForm(actor, f.id, f.revision);
  f = await getForm(actor, f.id);
  expect(f.status).toBe("paused");
  await closeForm(actor, f.id, f.revision);
  f = await getForm(actor, f.id);
  expect(f.status).toBe("closed");
  await expect(getForm({ ...actor, eventScopes: [] }, f.id)).rejects.toThrow(
    "Yetki yok",
  );
});
it("boş tarih ve alan yayımlanamaz; ayar kaydı revision'a bağlıdır", async () => {
  const f = (await createDraftForm(actor, eventId, {
    ...settings,
    opensAt: null,
  })) as { id: string };
  await expect(publishForm(actor, f.id, 1)).rejects.toThrow();
  await saveDraftForm(
    actor,
    f.id,
    { fields: [{ id: randomUUID(), type: "email", label: "E-posta" }] },
    1,
  );
  await expect(publishForm(actor, f.id, 2)).rejects.toThrow("Başlangıç");
  await saveFormSettings(actor, f.id, settings, 2);
  await expect(saveFormSettings(actor, f.id, settings, 2)).rejects.toThrow(
    "Sürüm çakışması",
  );
  await publishForm(actor, f.id, 3);
  const [audit] = await local.sql`select count(*)::int as n from audit_logs`;
  expect(audit.n).toBeGreaterThan(0);
});

it("reject yayın politikası hesap yerine tek zorunlu koşulsuz e-posta ister", async () => {
  const f = await createDraftForm(actor, eventId, {
    ...settings,
    duplicatePolicy: "reject",
  });
  await saveDraftForm(
    actor,
    f.id,
    {
      fields: [
        { id: randomUUID(), type: "email", label: "E-posta", required: false },
      ],
    },
    1,
  );
  await expect(publishForm(actor, f.id, 2)).rejects.toThrow(
    "Tekrar politikası",
  );
});

it("yayımlı form ayarı mevcut sürümün e-posta kimliğini bozmaz", async () => {
  const f = await createDraftForm(actor, eventId, settings);
  await saveDraftForm(
    actor,
    f.id,
    { fields: [{ id: randomUUID(), type: "short_text", label: "Not" }] },
    1,
  );
  await publishForm(actor, f.id, 2);
  await expect(
    saveFormSettings(
      actor,
      f.id,
      { ...settings, duplicatePolicy: "reject" },
      3,
    ),
  ).rejects.toThrow("Tekrar politikası");
});

it("yeni UluJam formu başvuru ve takım şablonuyla gerçek taslak olarak oluşturulur", async () => {
  await local.sql`update events set kind='ulujam' where id=${eventId}`;
  const created = await createDraftForm(actor, eventId, settings);
  const form = await getForm(actor, created.id);
  expect(form.eventKind).toBe("ulujam");
  expect(form.status).toBe("draft");
  expect(form.revision).toBe(created.revision);
  expect(form.current).toBeNull();
  expect(form.draft?.definition.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: "email", required: true }),
      expect.objectContaining({
        id: "15000000-0000-4000-8000-000000000004",
        options: [
          { value: "solo", label: "Tek başına katılıyorum" },
          { value: "seeking", label: "Takım arıyorum" },
          { value: "new", label: "Yeni takım kuruyorum" },
          { value: "existing", label: "Mevcut takıma katılıyorum" },
        ],
      }),
      expect.objectContaining({
        id: "15000000-0000-4000-8000-000000000007",
        condition: {
          op: "eq",
          fieldId: "15000000-0000-4000-8000-000000000004",
          value: "new",
        },
      }),
    ]),
  );
  await publishForm(actor, created.id, created.revision);
  expect((await getForm(actor, created.id)).status).toBe("published");
});

it("UluJam formu özel başlıkla (UluJam'26) saklanır ve silindiğinde cevaplarla birlikte veritabanından tamamen silinir", async () => {
  await local.sql`update events set kind='ulujam', status='draft' where id=${eventId}`;
  const created = await createDraftForm(actor, eventId, {
    ...settings,
    title: "UluJam'26",
    slug: "ulujam-26",
  });
  await publishForm(actor, created.id, created.revision);
  const formsList = await listForms(actor);
  expect(formsList.find((x) => x.id === created.id)?.title).toBe("UluJam'26");

  const form = await getForm(actor, created.id);
  await submitUlujam(
    {
      slug: "ulujam-26",
      versionId: form.current!.id,
      answers: {
        [uf.fullName]: "Test Katılımcı",
        [uf.email]: "katilimci@test.invalid",
        [uf.phone]: "+905551112233",
        [uf.mode]: "new",
        [uf.teamName]: "Silinecek Takım",
        [uf.expectedSize]: 3,
        [uf.skills]: ["software"],
        [uf.levels.software]: 3,
      },
    },
    randomUUID(),
  );

  const [beforeCounts] = await local.sql`select
    (select count(*)::int from forms where id=${created.id}) as forms,
    (select count(*)::int from form_versions where form_id=${created.id}) as versions,
    (select count(*)::int from submissions where form_id=${created.id}) as submissions,
    (select count(*)::int from submission_answers) as answers,
    (select count(*)::int from applications where event_id=${eventId}) as applications,
    (select count(*)::int from application_skills) as skills,
    (select count(*)::int from memberships) as memberships,
    (select count(*)::int from teams where event_id=${eventId}) as teams`;
  expect(beforeCounts.forms).toBe(1);
  expect(beforeCounts.submissions).toBe(1);
  expect(beforeCounts.answers).toBeGreaterThan(0);
  expect(beforeCounts.applications).toBe(1);
  expect(beforeCounts.skills).toBe(1);
  expect(beforeCounts.memberships).toBe(1);
  expect(beforeCounts.teams).toBe(1);

  await deleteForm(actor, created.id, form.revision);

  const [afterCounts] = await local.sql`select
    (select count(*)::int from forms where id=${created.id}) as forms,
    (select count(*)::int from form_versions where form_id=${created.id}) as versions,
    (select count(*)::int from form_fields) as fields,
    (select count(*)::int from form_rules) as rules,
    (select count(*)::int from submissions where form_id=${created.id}) as submissions,
    (select count(*)::int from submission_answers) as answers,
    (select count(*)::int from consents) as consents,
    (select count(*)::int from submission_status_history) as history,
    (select count(*)::int from idempotency_records) as idempotency,
    (select count(*)::int from applications where event_id=${eventId}) as applications,
    (select count(*)::int from application_skills) as skills,
    (select count(*)::int from memberships) as memberships,
    (select count(*)::int from cards) as cards,
    (select count(*)::int from teams where event_id=${eventId}) as teams`;
  expect(afterCounts).toEqual({
    forms: 0,
    versions: 0,
    fields: 0,
    rules: 0,
    submissions: 0,
    answers: 0,
    consents: 0,
    history: 0,
    idempotency: 0,
    applications: 0,
    skills: 0,
    memberships: 0,
    cards: 0,
    teams: 0,
  });
});
