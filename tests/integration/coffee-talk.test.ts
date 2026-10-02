import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { getDatabase, closeDatabase } from "../../src/lib/database/client";
import { seedCoffeeTalkDraft } from "../../src/db/seeds/development/coffee-talk-draft";
import {
  getPublicEvent,
  saveEvent,
  publishEvent,
} from "../../src/modules/events/application/event-service";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
  closeForm,
} from "../../src/modules/forms/application/form-service";
it("Coffee draft bilinmeyen veriyi uydurmaz; CTA sadece eşleşen açık genel forma çıkar", async () => {
  const local = await createTestDatabase(),
    old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  try {
    await migrateEmptyDatabase();
    const id = await seedCoffeeTalkDraft(getDatabase());
    expect(await seedCoffeeTalkDraft(getDatabase())).toBe(id);
    const [draft] = await local.sql`select * from events where id=${id}`;
    expect(draft).toMatchObject({
      status: "draft",
      starts_at: null,
      location: null,
      media_id: null,
      form_id: null,
    });
    expect(await getPublicEvent("coffee-talk")).toBeNull();
    const actor = {
      adminId: randomUUID(),
      roles: ["content_editor", "event_manager"],
      eventScopes: [id],
    };
    await local.sql`insert into admins(id,email,password_hash) values(${actor.adminId},'coffee@test.invalid','not-login')`;
    const form = await createDraftForm(actor, id, {
      title: "Demo form",
      slug: "coffee-test",
      opensAt: "2020-01-01T00:00:00Z",
      closesAt: null,
      capacity: 2,
      waitlist: false,
      duplicatePolicy: "allow",
      thankYou: "Test",
      retentionDays: 1,
    });
    await saveDraftForm(
      actor,
      form.id,
      {
        fields: [
          { id: randomUUID(), type: "short_text", label: "Ad", required: true },
        ],
      },
      1,
    );
    const input = {
      title: "Coffee Talk DEMO",
      slug: "coffee-talk",
      kind: "general",
      startsAt: "2030-01-01T12:00:00Z",
      location: "DEMO yer",
      formId: form.id,
    };
    await saveEvent(actor, input, id, 1);
    await publishEvent(id, actor, 2);
    expect((await getPublicEvent("coffee-talk"))!.applicationUrl).toBeNull();
    await publishForm(actor, form.id, 2);
    expect((await getPublicEvent("coffee-talk"))!.applicationUrl).toBe(
      "/basvuru/coffee-test",
    );
    await closeForm(actor, form.id, 3);
    expect((await getPublicEvent("coffee-talk"))!.applicationUrl).toBeNull();
  } finally {
    await closeDatabase();
    await local.cleanup();
    process.env.DATABASE_URL = old;
  }
});
