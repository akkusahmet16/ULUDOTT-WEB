import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { sql as query } from "drizzle-orm";
import { createTestDatabase } from "../helpers/local-database";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate";
import { closeDatabase } from "../../src/lib/database/client";
import { withTransaction } from "../../src/lib/database/transaction";
import { appendAudit } from "../../src/lib/logging/audit";
import { enqueue } from "../../src/lib/queue/outbox";

// Mutation hedefleri: migration'a seed eklenmesi, FK/CHECK/unique kaldırılması,
// transaction dışına audit/outbox yazılması veya audit'e kişisel değer kabulü.
let local: Awaited<ReturnType<typeof createTestDatabase>>;
let originalUrl: string | undefined;
beforeAll(async () => {
  local = await createTestDatabase();
  originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = local.url;
});
afterAll(async () => {
  await closeDatabase();
  if (local) await local.cleanup();
  process.env.DATABASE_URL = originalUrl;
});
const required = [
  "retention_runs",
  "content_redirects",
  "admins",
  "admin_sessions",
  "admin_roles",
  "admin_event_scopes",
  "events",
  "event_categories",
  "event_years",
  "event_gallery",
  "announcements",
  "featured_slots",
  "media_assets",
  "media_variants",
  "forms",
  "form_versions",
  "form_fields",
  "form_rules",
  "submissions",
  "submission_answers",
  "submission_status_history",
  "consents",
  "applications",
  "application_skills",
  "teams",
  "memberships",
  "team_access",
  "team_sessions",
  "team_approvals",
  "games",
  "game_credits",
  "awards",
  "finalists",
  "cards",
  "wallet_passes",
  "apple_devices",
  "apple_registrations",
  "links",
  "link_groups",
  "outbox",
  "idempotency_records",
  "audit_logs",
  "rate_limits",
];

it("boş DB migration ve ikinci çalıştırmada kişi/takım/kart dahil hiçbir seed üretmez", async () => {
  await migrateEmptyDatabase();
  const [first] =
    await local.sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  expect(first.count).toBeGreaterThan(0);
  await migrateEmptyDatabase();
  const tables =
    await local.sql`select table_name from information_schema.tables where table_schema='public'`;
  expect(tables.map((r) => r.table_name).sort()).toEqual([...required].sort());
  for (const name of required) {
    const [row] = await local.sql.unsafe(
      `select count(*)::int as count from "${name}"`,
    );
    expect(row.count, name).toBe(0);
  }
  const migrations =
    await local.sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  expect(migrations[0].count).toBe(first.count);
});

describe("gerçek PostgreSQL constraint ve atomiklik", () => {
  beforeEach(async () => {
    await migrateEmptyDatabase();
  });
  async function event() {
    const [row] =
      await local.sql`insert into events (title,slug,kind) values ('Test etkinlik',${randomUUID()},'ulujam') returning id`;
    return row.id as string;
  }
  async function admin() {
    const [row] =
      await local.sql`insert into admins (email,password_hash) values (${`${randomUUID()}@test.invalid`},'test-only-hash') returning id`;
    return {
      adminId: row.id as string,
      roles: ["event_manager"],
      eventScopes: [],
    };
  }
  it("aynı etkinlikte e-posta tekil, farklı etkinlikte yeniden başvurulabilir", async () => {
    const a = await event(),
      b = await event();
    await local.sql`insert into applications (event_id,full_name,email,phone,mode) values (${a},'Test kişi','sample@test.invalid','+905001112233','solo')`;
    await expect(
      local.sql`insert into applications (event_id,full_name,email,phone,mode) values (${a},'Test kişi','sample@test.invalid','+905001112233','solo')`,
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      local.sql`insert into applications (event_id,full_name,email,phone,mode) values (${b},'Test kişi','sample@test.invalid','+905001112233','solo')`,
    ).resolves.toBeDefined();
  });
  it("eksik telefon ve bozuk katılım modu DB'de reddedilir", async () => {
    const id = await event();
    await expect(
      local.sql`insert into applications (event_id,full_name,email,mode) values (${id},'Test','a@test.invalid','solo')`,
    ).rejects.toMatchObject({ code: "23502" });
    await expect(
      local.sql`insert into applications (event_id,full_name,email,phone,mode) values (${id},'Test','a@test.invalid','+905001112233','fake')`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("olmayan etkinliğe başvuru FK ile reddedilir", async () => {
    await expect(
      local.sql`insert into applications (event_id,full_name,email,phone,mode) values (${randomUUID()},'Test','a@test.invalid','+905001112233','solo')`,
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("UTC anını farklı oturum saat diliminde aynı tutar ve ters tarih aralığını reddeder", async () => {
    const id = await event();
    await local.sql`update events set starts_at='2027-02-01T18:00:00+03:00', ends_at='2027-02-01T19:00:00+03:00' where id=${id}`;
    await local.sql`set time zone 'America/New_York'`;
    const [row] = await local.sql`select starts_at from events where id=${id}`;
    expect(row.starts_at.toISOString()).toBe("2027-02-01T15:00:00.000Z");
    await expect(
      local.sql`update events set ends_at='2027-01-01T00:00:00Z' where id=${id}`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("audit ve outbox aynı transaction'da iş verisiyle birlikte commit edilir", async () => {
    const actor = await admin(),
      id = randomUUID();
    const result = await withTransaction(async (tx) => {
      await tx.execute(
        query`insert into events (id,title,slug,kind) values (${id},'Atomik test',${id},'general')`,
      );
      await appendAudit(
        tx,
        actor,
        "event.created",
        { type: "event", id },
        { revision: 1, changedFields: ["title"] },
      );
      await enqueue(tx, "event.published", id, 1, { eventId: id });
      return id;
    });
    expect(result).toBe(id);
    expect(
      (
        await local.sql`select count(*)::int as count from audit_logs where object_id=${id}`
      )[0].count,
    ).toBe(1);
    expect(
      (
        await local.sql`select count(*)::int as count from outbox where aggregate_id=${id}`
      )[0].count,
    ).toBe(1);
  });
  it("hata iş kaydını, audit'i ve outbox'ı birlikte rollback eder", async () => {
    const actor = await admin(),
      id = randomUUID();
    await expect(
      withTransaction(async (tx) => {
        await tx.execute(
          query`insert into events (id,title,slug,kind) values (${id},'Rollback',${id},'general')`,
        );
        await appendAudit(
          tx,
          actor,
          "event.created",
          { type: "event", id },
          { revision: 1 },
        );
        await enqueue(tx, "event.published", id, 1, { eventId: id });
        throw new Error("deliberate rollback");
      }),
    ).rejects.toThrow("deliberate rollback");
    for (const table of ["events", "audit_logs", "outbox"]) {
      const field =
        table === "events"
          ? "id"
          : table === "audit_logs"
            ? "object_id"
            : "aggregate_id";
      expect(
        (
          await local.sql.unsafe(
            `select count(*)::int as count from ${table} where ${field}=$1`,
            [id],
          )
        )[0].count,
      ).toBe(0);
    }
  });
  it("unique ihlali transaction'ın önceki audit/outbox yazılarını da geri alır", async () => {
    const actor = await admin(),
      id = randomUUID(),
      existing = await event();
    const [row] = await local.sql`select slug from events where id=${existing}`;
    await expect(
      withTransaction(async (tx) => {
        await appendAudit(
          tx,
          actor,
          "event.created",
          { type: "event", id },
          { revision: 1 },
        );
        await enqueue(tx, "event.published", id, 1, { eventId: id });
        await tx.execute(
          query`insert into events (title,slug,kind) values ('Duplicate',${row.slug},'general')`,
        );
      }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
    expect(
      (
        await local.sql`select count(*)::int as count from outbox where aggregate_id=${id}`
      )[0].count,
    ).toBe(0);
    expect(
      (
        await local.sql`select count(*)::int as count from audit_logs where object_id=${id}`
      )[0].count,
    ).toBe(0);
  });
  it("audit'e ham telefon/e-posta/parola verilmesini reddeder", async () => {
    const actor = await admin();
    await expect(
      withTransaction((tx) =>
        appendAudit(
          tx,
          actor,
          "application.updated",
          { type: "application", id: randomUUID() },
          {
            email: "secret@test.invalid",
            phone: "+905001112233",
            password: "never-log",
          },
        ),
      ),
    ).rejects.toThrow("Denetim değişiklikleri");
  });
  it("aynı iş revision'ını iki defa kuyruğa eklemez, yeni revision ayrı kalır", async () => {
    const id = randomUUID();
    await withTransaction(async (tx) => {
      await enqueue(tx, "card.updated", id, 1, { cardId: id });
      await enqueue(tx, "card.updated", id, 1, { cardId: id });
      await enqueue(tx, "card.updated", id, 2, { cardId: id });
    });
    expect(
      (
        await local.sql`select revision from outbox where aggregate_id=${id} order by revision`
      ).map((r) => r.revision),
    ).toEqual([1, 2]);
  });
});

describe("etkinlik ve sürüm izolasyonu", () => {
  beforeEach(async () => {
    await migrateEmptyDatabase();
  });
  async function event() {
    const [r] =
      await local.sql`insert into events(title,slug,kind) values ('İzolasyon',${randomUUID()},'ulujam') returning id`;
    return r.id as string;
  }
  it("bir etkinliğin oyununu başka etkinlikte derece/finalist veya takımla ilişkilendiremez", async () => {
    const a = await event(),
      b = await event();
    const [game] =
      await local.sql`insert into games(event_id,itch_url) values (${a},'https://example.itch.io/game') returning id`;
    await expect(
      local.sql`insert into awards(event_id,game_id,rank) values (${b},${game.id},1)`,
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      local.sql`insert into finalists(event_id,game_id,position) values (${b},${game.id},0)`,
    ).rejects.toMatchObject({ code: "23503" });
    const [team] =
      await local.sql`insert into teams(event_id,name,normalized_name,expected_size) values (${b},'Başka','başka',2) returning id`;
    await expect(
      local.sql`update games set team_id=${team.id} where id=${game.id}`,
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("bir kişinin aynı anda iki aktif takım üyeliği olamaz; eski üyelik kapatılınca taşınabilir", async () => {
    const e = await event();
    const [a] =
      await local.sql`insert into applications(event_id,full_name,email,phone,mode) values (${e},'Test','member@test.invalid','+905001112233','new') returning id`;
    const [t1] =
      await local.sql`insert into teams(event_id,name,normalized_name,expected_size) values (${e},'Bir','bir',2) returning id`;
    const [t2] =
      await local.sql`insert into teams(event_id,name,normalized_name,expected_size) values (${e},'İki','iki',2) returning id`;
    await local.sql`insert into memberships(event_id,team_id,application_id) values (${e},${t1.id},${a.id})`;
    await expect(
      local.sql`insert into memberships(event_id,team_id,application_id) values (${e},${t2.id},${a.id})`,
    ).rejects.toMatchObject({ code: "23505" });
    await local.sql`update memberships set left_at=now() where application_id=${a.id}`;
    await expect(
      local.sql`insert into memberships(event_id,team_id,application_id) values (${e},${t2.id},${a.id})`,
    ).resolves.toBeDefined();
  });
  it("form başvurusunda etkinlik ve yayımlanmış sürüm başka formdan alınamaz", async () => {
    const a = await event(),
      b = await event();
    const [f1] =
      await local.sql`insert into forms(event_id,title,slug) values (${a},'Form A',${randomUUID()}) returning id`;
    const [f2] =
      await local.sql`insert into forms(event_id,title,slug) values (${b},'Form B',${randomUUID()}) returning id`;
    const [v] =
      await local.sql`insert into form_versions(form_id,version,snapshot) values (${f1.id},1,'{}') returning id`;
    await expect(
      local.sql`insert into submissions(form_id,version_id,event_id,snapshot,receipt_token_hash) values (${f2.id},${v.id},${b},'{}',${randomUUID()})`,
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      local.sql`insert into submissions(form_id,version_id,event_id,snapshot,receipt_token_hash) values (${f1.id},${v.id},${b},'{}',${randomUUID()})`,
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("cevaplar başka sürümdeki alan anahtarına bağlanamaz ve dosya alanı kapalıdır", async () => {
    const [f] =
      await local.sql`insert into forms(title,slug) values ('Form',${randomUUID()}) returning id`;
    const [v1] =
      await local.sql`insert into form_versions(form_id,version,snapshot) values (${f.id},1,'{}') returning id`;
    const [v2] =
      await local.sql`insert into form_versions(form_id,version,snapshot) values (${f.id},2,'{}') returning id`;
    const field = randomUUID();
    await local.sql`insert into form_fields(version_id,field_key,type,label,position) values (${v2.id},${field},'short_text','Ad',0)`;
    const [s] =
      await local.sql`insert into submissions(form_id,version_id,snapshot,receipt_token_hash) values (${f.id},${v1.id},'{}',${randomUUID()}) returning id`;
    await expect(
      local.sql`insert into submission_answers(submission_id,version_id,field_key,value) values (${s.id},${v1.id},${field},'"test"')`,
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      local.sql`insert into form_fields(version_id,field_key,type,label,position) values (${v1.id},${randomUUID()},'file','Dosya',1)`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("üye ve takım farklı etkinlikten olamaz, beceri seviyesi 1–5 dışına çıkamaz", async () => {
    const a = await event(),
      b = await event();
    const [app] =
      await local.sql`insert into applications(event_id,full_name,email,phone,mode) values (${a},'Test','cross@test.invalid','+905001112233','existing') returning id`;
    const [team] =
      await local.sql`insert into teams(event_id,name,normalized_name,expected_size) values (${b},'Takım','takım',2) returning id`;
    await expect(
      local.sql`insert into memberships(event_id,team_id,application_id) values (${a},${team.id},${app.id})`,
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      local.sql`insert into application_skills(application_id,skill,level) values (${app.id},'programming',6)`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("başvuru onayı yeni kartı kendiliğinden aktif yapmaz ve sağlayıcı nesnesi tekildir", async () => {
    const e = await event();
    const [a] =
      await local.sql`insert into applications(event_id,full_name,email,phone,mode,status) values (${e},'Test','card@test.invalid','+905001112233','solo','approved') returning id`;
    const [c] =
      await local.sql`insert into cards(application_id,token_hash,checkin_token_hash) values (${a.id},${randomUUID()},${randomUUID()}) returning id,status`;
    expect(c.status).toBe("pending");
    await local.sql`insert into wallet_passes(card_id,provider,object_id) values (${c.id},'google','test-object-1')`;
    await expect(
      local.sql`insert into wallet_passes(card_id,provider,object_id) values (${c.id},'google','test-object-2')`,
    ).rejects.toMatchObject({ code: "23505" });
  });
  it("outbox içine ham kişi verisi ve sıfır revision kabul edilmez", async () => {
    const id = randomUUID();
    await expect(
      withTransaction((tx) =>
        enqueue(tx, "card.updated", id, 1, { email: "private@test.invalid" }),
      ),
    ).rejects.toThrow("Geçersiz outbox");
    await expect(
      withTransaction((tx) =>
        enqueue(tx, "card.updated", id, 0, { cardId: id }),
      ),
    ).rejects.toThrow("Geçersiz outbox");
  });
});
