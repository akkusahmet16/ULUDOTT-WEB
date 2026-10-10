import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { setPanelPassword } from "../../src/modules/admin/application/panel-password";
import { setupLocalDemo } from "../../src/modules/applications/application/local-demo-setup";
import { getPublicForm } from "../../src/modules/forms/application/public-form-service";
import { pauseForm, publishForm } from "../../src/modules/forms/application/form-service";
import { requireActiveCard } from "../../src/modules/cards/application/card-service";
import { getDatabase } from "../../src/lib/database/client";
import { forms } from "../../src/db/schema/forms";
import { eq } from "drizzle-orm";

afterEach(() => vi.unstubAllEnvs());

it("creates one local scenario with private access data and no duplicate on rerun", async () => {
  const db = await createTestDatabase();
  const temp = await mkdtemp(join(tmpdir(), "uludott-demo-"));
  const previous = process.env.DATABASE_URL;
  try {
    vi.stubEnv("DATABASE_URL", db.url);
    vi.stubEnv("APP_URL", "http://127.0.0.1:3001");
    vi.stubEnv("LOCAL_DEMO_MODE", "true");
    await migrateEmptyDatabase();
    await setPanelPassword("local-test-password");
    const accessPath = join(temp, "access.json");
    const first = await setupLocalDemo(accessPath);
    const again = await setupLocalDemo(accessPath);
    expect(again).toEqual(first);
    expect((await stat(accessPath)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(accessPath, "utf8")).team.token).toBe(
      first.team.token,
    );
    const [counts] = await db.sql`select
      (select count(*)::int from events where slug='demo-ulujam-yerel') events,
      (select count(*)::int from forms where slug='demo-ulujam-yerel') forms,
      (select count(*)::int from teams where event_id=${first.eventId}) teams,
      (select count(*)::int from applications where event_id=${first.eventId}) applications,
      (select count(*)::int from cards c join applications a on a.id=c.application_id where a.event_id=${first.eventId}) cards`;
    expect(counts).toMatchObject({ events: 1, forms: 1, teams: 1, applications: 2, cards: 2 });
    const [admin] = await db.sql`select id from admins where email='panel@uludott.invalid'`;
    const actor = { adminId: admin.id as string, roles: ["event_manager"], eventScopes: [first.eventId] };
    const [form] = await getDatabase().select().from(forms).where(eq(forms.id, first.formId));
    expect((await getPublicForm("demo-ulujam-yerel"))?.state).toBe("open");
    await pauseForm(actor, form.id, form.revision);
    expect((await getPublicForm("demo-ulujam-yerel"))?.state).not.toBe("open");
    await publishForm(actor, form.id, form.revision + 1);
    expect((await getPublicForm("demo-ulujam-yerel"))?.state).toBe("open");
    await expect(requireActiveCard(first.cards.founder)).rejects.toMatchObject({ status: 403 });
  } finally {
    await closeDatabase();
    await db.cleanup();
    await rm(temp, { recursive: true, force: true });
    process.env.DATABASE_URL = previous;
  }
});

it("refuses setup on a non-local address even with the demo flag", async () => {
  vi.stubEnv("APP_URL", "https://uludott.com.tr");
  vi.stubEnv("LOCAL_DEMO_MODE", "true");
  await expect(setupLocalDemo()).rejects.toThrow(/yalnız yerel/);
});
