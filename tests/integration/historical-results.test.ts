import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { getDatabase, closeDatabase } from "../../src/lib/database/client";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { listPublicHistoricalResults } from "../../src/modules/games/application/historical-results";
let local: Awaited<ReturnType<typeof createTestDatabase>>,
  original: string | undefined;
const urls = [
  "https://subzero-41.itch.io/lost-pieces",
  "https://kmevciman.itch.io/lostchildsoul",
  "https://kairosthegeek.itch.io/project-sw",
];
beforeEach(async () => {
  local = await createTestDatabase();
  original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
  await migrateEmptyDatabase();
});
afterEach(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = original;
});
async function seeded() {
  await seed2026Results(getDatabase());
  const rows = await listPublicHistoricalResults(2026);
  expect(rows).toHaveLength(3);
  return rows;
}
it("2026 dereceleri doğru sırada, eksik alanlar null ve kişi/takım tabloları boş kalır", async () => {
  const rows = await seeded();
  expect(rows.map((x) => [x.rank, x.itchUrl])).toEqual(
    urls.map((u, i) => [i + 1, u]),
  );
  for (const row of rows)
    expect([
      row.title,
      row.team,
      row.credits,
      row.image,
      row.description,
      row.status,
    ]).toEqual([null, null, null, null, null, "historical_partial"]);
  for (const table of [
    "applications",
    "application_skills",
    "teams",
    "memberships",
    "submissions",
    "game_credits",
    "cards",
    "wallet_passes",
    "finalists",
  ]) {
    const [r] = await local.sql.unsafe(
      `select count(*)::int as n from ${table}`,
    );
    expect(r.n).toBe(0);
  }
  const [event] =
    await local.sql`select status,starts_at,ends_at,location,publish_at from events`;
  expect(event).toEqual({
    status: "draft",
    starts_at: null,
    ends_at: null,
    location: null,
    publish_at: null,
  });
});
it("seed tekrarı ve eşzamanlı koşu çift editoryal kayıt oluşturmaz", async () => {
  await Promise.all([
    seed2026Results(getDatabase()),
    seed2026Results(getDatabase()),
  ]);
  await seeded();
  for (const [table, count] of [
    ["events", 1],
    ["event_years", 1],
    ["games", 3],
    ["awards", 3],
  ] as const) {
    const [r] = await local.sql.unsafe(
      `select count(*)::int as n from ${table}`,
    );
    expect(r.n).toBe(count);
  }
});
it("tekrar seed gizlenmiş kaydı yayımlamaz ve editoryal alanları ezmez", async () => {
  const rows = await seeded();
  await local.sql`update games set published_at=null,title='Editörün başlığı' where id=${rows[0].id}`;
  await seed2026Results(getDatabase());
  expect((await listPublicHistoricalResults(2026)).map((x) => x.rank)).toEqual([
    2, 3,
  ]);
  const [g] =
    await local.sql`select title,published_at from games where id=${rows[0].id}`;
  expect(g).toEqual({ title: "Editörün başlığı", published_at: null });
});
it("2027 eksik sonucu historical_partial bayrağıyla tarihî istisnadan yararlanamaz", async () => {
  await seeded();
  const event = randomUUID(),
    game = randomUUID();
  await local.sql`insert into events(id,title,slug,kind) values(${event},'Test 2027','test-2027','ulujam')`;
  await local.sql`insert into event_years(event_id,year) values(${event},2027)`;
  await local.sql`insert into games(id,event_id,itch_url,historical_partial,published_at) values(${game},${event},${urls[0]},true,'2020-01-01T00:00:00Z')`;
  await local.sql`insert into awards(event_id,game_id,rank) values(${event},${game},1)`;
  expect(await listPublicHistoricalResults(2027)).toEqual([]);
});
it("bilinen derece URL'si değişirse veya etkinlik arşivlenirse kısmi sonuç görünmez", async () => {
  const rows = await seeded();
  await local.sql`update games set itch_url='https://unknown.itch.io/foreign' where id=${rows[0].id}`;
  expect((await listPublicHistoricalResults(2026)).map((x) => x.rank)).toEqual([
    2, 3,
  ]);
  await local.sql`update events set status='archived'`;
  expect(await listPublicHistoricalResults(2026)).toEqual([]);
});
it("2026 yıl ilişkisi başka kayda aitse seed transaction rollback yapar", async () => {
  const event = randomUUID();
  await local.sql`insert into events(id,title,slug,kind) values(${event},'Çakışan kayıt','different-2026','ulujam')`;
  await local.sql`insert into event_years(event_id,year) values(${event},2026)`;
  await expect(seed2026Results(getDatabase())).rejects.toThrow();
  const [r] =
    await local.sql`select (select count(*)::int from events) as events,(select count(*)::int from games) as games`;
  expect(r).toEqual({ events: 1, games: 0 });
});
