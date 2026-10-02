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
  getForm,
  saveFormSettings,
} from "../../src/modules/forms/application/form-service";
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
  duplicatePolicy: "reject",
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
