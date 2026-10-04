import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { setPanelPassword } from "../../src/modules/admin/application/panel-password";
import { authenticatePanelPassword } from "../../src/modules/admin/application/auth-service";
import { resolveSession } from "../../src/lib/auth/session";

let local: Awaited<ReturnType<typeof createTestDatabase>>;
let original: string | undefined;
beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
});
afterAll(async () => {
  await closeDatabase();
  await local.cleanup();
  process.env.DATABASE_URL = original;
});

it("tek özel şifre tüm panel yetkilerini açar ve yeni etkinlik kapsamını otomatik görür", async () => {
  const firstEvent = randomUUID();
  await local.sql`insert into events(id,title,slug,kind) values(${firstEvent},'Test',${firstEvent},'ulujam')`;
  await setPanelPassword("Test-only-panel-password-42");
  const session = await authenticatePanelPassword(
    "Test-only-panel-password-42",
  );
  expect(session.actor.roles).toEqual(
    expect.arrayContaining(["content_editor", "event_manager", "system_admin"]),
  );
  expect(session.actor.eventScopes).toContain(firstEvent);
  const secondEvent = randomUUID();
  await local.sql`insert into events(id,title,slug,kind) values(${secondEvent},'Yeni',${secondEvent},'ulujam')`;
  expect((await resolveSession(session.token))?.actor.eventScopes).toContain(
    secondEvent,
  );
});

it("yanlış şifre reddedilir; şifre yenileme eski oturumları geçersiz kılar", async () => {
  await expect(authenticatePanelPassword("wrong")).rejects.toThrow(
    "Giriş bilgileri doğrulanamadı",
  );
  const session = await authenticatePanelPassword(
    "Test-only-panel-password-42",
  );
  await setPanelPassword("Test-only-next-password-43");
  expect(await resolveSession(session.token)).toBeNull();
  await expect(
    authenticatePanelPassword("Test-only-panel-password-42"),
  ).rejects.toThrow("Giriş bilgileri doğrulanamadı");
  await expect(
    authenticatePanelPassword("Test-only-next-password-43"),
  ).resolves.toBeDefined();
});
