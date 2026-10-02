import { randomUUID } from "node:crypto";
import { createTestDatabase } from "./local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import {
  createDraftForm,
  saveDraftForm,
  publishForm,
} from "../../src/modules/forms/application/form-service";
import {
  buildUlujamFormDefinition,
  ulujamFields as f,
} from "../../src/modules/applications/domain/ulujam-input";
export async function ulujamFixture() {
  const local = await createTestDatabase(),
    old = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  const eventId = randomUUID(),
    adminId = randomUUID();
  await local.sql`insert into events(id,title,slug,kind,starts_at,location,status,max_team_size,publish_at) values(${eventId},'DEMO UluJam',${"demo-" + eventId},'ulujam','2030-01-01','DEMO yer','published',6,'2020-01-01')`;
  await local.sql`insert into admins(id,email,password_hash) values(${adminId},${adminId + "@test.invalid"},'not-login')`;
  const actor = { adminId, roles: ["event_manager"], eventScopes: [eventId] },
    slug = "form-" + randomUUID();
  const form = await createDraftForm(actor, eventId, {
    title: "DEMO UluJam form",
    slug,
    opensAt: "2020-01-01T00:00:00Z",
    closesAt: null,
    capacity: 30,
    waitlist: false,
    duplicatePolicy: "reject",
    thankYou: "DEMO alındı",
    retentionDays: 1,
  });
  await saveDraftForm(actor, form.id, buildUlujamFormDefinition(eventId), 1);
  const published = await publishForm(actor, form.id, 2);
  const [row] =
    await local.sql`select current_version_id from forms where id=${form.id}`;
  function input(
    mode = "solo",
    email = randomUUID() + "@test.invalid",
    extra: Record<string, unknown> = {},
  ) {
    return {
      slug,
      versionId: row.current_version_id,
      answers: {
        [f.fullName]: "DEMO kişi",
        [f.email]: email,
        [f.phone]: "+905551234567",
        [f.mode]: mode,
        [f.skills]: ["software"],
        [f.levels.software]: 3,
        ...(mode === "new"
          ? { [f.teamName]: "DEMO takım", [f.expectedSize]: 2 }
          : {}),
        ...extra,
      },
    };
  }
  return {
    ...local,
    eventId,
    actor,
    form,
    input,
    published,
    cleanup: async () => {
      await closeDatabase();
      await local.cleanup();
      process.env.DATABASE_URL = old;
    },
  };
}
