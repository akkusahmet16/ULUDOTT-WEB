import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { closeDatabase } from "../../src/lib/database/client.ts";
import * as publication from "../../src/modules/publication/service.ts";

let local: Awaited<ReturnType<typeof createTestDatabase>>;
let original: string | undefined;
const actorId = randomUUID();
const now = new Date("2030-01-01T12:00:00Z");
const createdAt = "2000-01-01T00:00:00Z";

beforeAll(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
  await local.sql`insert into admins(id,email,password_hash) values(${actorId},'sitemap@test.invalid','not-a-login')`;
});
afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});

it("sitemap taslak/arşiv/gelecek/sona ermiş pencereyi dışlar; son audit zamanını kullanır", async () => {
  const ids = new Map<string, string>();
  for (const [slug, status, publishAt, unpublishAt] of [
    ["visible", "published", "2001-01-01T00:00:00Z", null],
    ["ended", "ended", "2001-01-01T00:00:00Z", null],
    ["cancelled", "cancelled", "2001-01-01T00:00:00Z", null],
    ["draft", "draft", "2001-01-01T00:00:00Z", null],
    ["archived", "archived", "2001-01-01T00:00:00Z", null],
    ["future", "scheduled", "2031-01-01T00:00:00Z", null],
    ["expired", "published", "2001-01-01T00:00:00Z", "2020-01-01T00:00:00Z"],
    ["missing-date", "published", null, null],
  ] as const) {
    const id = randomUUID();
    ids.set(slug, id);
    await local.sql`insert into events(id,title,slug,kind,status,publish_at,unpublish_at,created_at) values(${id},${slug},${slug},'general',${status},${publishAt},${unpublishAt},${createdAt})`;
  }
  for (const timestamp of ["2028-01-01T00:00:00Z", "2029-01-01T00:00:00Z"]) {
    await local.sql`insert into audit_logs(actor_id,action,object_type,object_id,changes,created_at) values(${actorId},'event.saved','event',${ids.get("visible")!},'{}',${timestamp})`;
  }
  const events = await publication.listIndexablePublications("event", now);
  expect(events.map(item => item.slug).sort()).toEqual(["cancelled", "ended", "visible"]);
  expect(events.find(item => item.slug === "visible")?.lastModified).toEqual(new Date("2029-01-01T00:00:00Z"));
  expect(events.find(item => item.slug === "ended")?.lastModified).toEqual(new Date(createdAt));

  await local.sql`insert into announcements(title,slug,body,status,publish_at) values('Live','live-note','test','published','2001-01-01'),('Draft','draft-note','test','draft','2001-01-01'),('Removed','removed-note','test','archived','2001-01-01'),('Future','future-note','test','scheduled','2031-01-01')`;
  expect((await publication.listIndexablePublications("announcement", now)).map(item => item.slug)).toEqual(["live-note"]);
});

it("sitemap genel ekranların 100 kayıt sınırından etkilenmez", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    title: "Sitemap fixture",
    slug: `bulk-${index}`,
    kind: "general",
    status: "published",
    publish_at: "2001-01-01T00:00:00Z",
  }));
  await local.sql`insert into events ${local.sql(rows)}`;
  const items = await publication.listIndexablePublications("event", now);
  expect(items.filter(item => item.slug.startsWith("bulk-")).length).toBe(101);
});
