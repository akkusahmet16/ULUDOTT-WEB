import { expect, it, vi } from "vitest";
import { authenticatePanelPassword } from "../../src/modules/admin/application/auth-service.ts";
import type { Sql } from "postgres";
import { createTestDatabase } from "../helpers/local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { closeDatabase } from "../../src/lib/database/client.ts";
import { verifyPassword } from "../../src/lib/auth/crypto.ts";
import { getPublicForm } from "../../src/modules/forms/application/public-form-service.ts";
import { getForm } from "../../src/modules/forms/application/form-service.ts";
import { getSubmission } from "../../src/modules/forms/application/submission-admin.ts";
import { getGameEditor } from "../../src/modules/games/application/game-service.ts";
import { getPublicGame } from "../../src/modules/games/infrastructure/game-repository.ts";
import { getUlujamPreview } from "../../src/modules/applications/application/ulujam-preview.ts";
import { getUlujamPresentation } from "../../src/modules/site-settings/application/ulujam-settings.ts";
import {
  seedVisualFixture,
  VISUAL_FIXED_TIME,
  VISUAL_PANEL_PASSWORD,
  type VisualProfile,
} from "../helpers/visual-fixture.ts";

type OwnedDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

async function withDatabase<T>(work: (local: OwnedDatabase) => Promise<T>) {
  const previous = process.env.DATABASE_URL;
  let local: OwnedDatabase | undefined;
  try {
    local = await createTestDatabase();
    await closeDatabase();
    process.env.DATABASE_URL = local.url;
    await migrateEmptyDatabase();
    return await work(local);
  } finally {
    try {
      await closeDatabase();
      await local?.cleanup();
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  }
}

async function tableCounts(sql: Sql) {
  const tables = await sql`select table_name from information_schema.tables
    where table_schema='public' and table_type='BASE TABLE' order by table_name`;
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const [row] =
      await sql`select count(*)::int as count from ${sql(String(table.table_name))}`;
    counts[String(table.table_name)] = Number(row.count);
  }
  return counts;
}

async function visibleFingerprint(sql: Sql) {
  const counts = await tableCounts(sql);
  const result: Record<string, unknown> = {};
  for (const table of Object.keys(counts)) {
    // Argon2's salt is intentionally random and never rendered. Every other
    // seeded record, identifier and timestamp must match across fresh DBs.
    const [row] =
      table === "admins"
        ? await sql`select coalesce(jsonb_agg(to_jsonb(t)-'password_hash' order by to_jsonb(t)-'password_hash'),'[]'::jsonb) as records from admins t`
        : await sql`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)),'[]'::jsonb) as records from ${sql(table)} t`;
    result[table] = row.records;
  }
  return result;
}

it.each(["empty", "static-approved", "full"] as const)(
  "seeds the %s visual profile only in its disposable owned database",
  async (profile: VisualProfile) => {
    await withDatabase(async (local) => {
      const before = await tableCounts(local.sql);
      expect(Object.values(before).every((count) => count === 0)).toBe(true);
      const fixture = await seedVisualFixture(local.sql, profile);
      const after = await tableCounts(local.sql);
      expect(fixture.profile).toBe(profile);
      expect(fixture.available).toEqual({
        approvedStatics: profile !== "empty",
        syntheticDetails: profile === "full",
        adminLogin: profile !== "empty",
      });
      for (const table of [
        "media_assets",
        "media_variants",
        "team_access",
        "team_sessions",
        "admin_sessions",
        "cards",
        "idempotency_records",
        "submission_files",
      ])
        expect(after[table], table).toBe(0);
      const [capabilities] = await local.sql`select
        (select count(*) from applications where token_hash is not null)+
        (select count(*) from game_credits where consent_token_hash is not null or consent_token_encrypted is not null) as count`;
      expect(Number(capabilities.count)).toBe(0);
      expect(JSON.stringify(fixture)).not.toMatch(
        /password|receiptToken|cardToken|csrf|\/takim\/|\/kart\/|\/yayin-onayi\//i,
      );
      if (profile === "empty") {
        expect(after).toEqual(before);
        return;
      }
      expect(after.admins).toBe(1);
      expect(after.games).toBe(3);
      expect(after.awards).toBe(3);
      const [account] = await local.sql`select id,password_hash from admins`;
      expect(account.id).toBe(fixture.ids.adminId);
      expect(
        await verifyPassword(
          String(account.password_hash),
          VISUAL_PANEL_PASSWORD,
        ),
      ).toBe(true);
      const [audit] = await local.sql`select created_at from audit_logs`;
      expect(new Date(audit.created_at).toISOString()).toBe(VISUAL_FIXED_TIME);
      if (profile === "static-approved") {
        expect(after.events).toBe(3);
        expect(after.forms).toBe(0);
        expect(after.submissions).toBe(0);
        expect(after.site_game_entries).toBe(0);
        const [coffee] =
          await local.sql`select status from events where slug='coffee-talk'`;
        expect(coffee.status).toBe("draft");
        return;
      }
      expect(after.events).toBe(7);
      expect(after.forms).toBe(2);
      expect(after.form_versions).toBe(2);
      expect(after.submissions).toBe(1);
      expect(after.applications).toBe(2);
      expect(after.teams).toBe(1);
      expect(after.site_game_entries).toBe(1);
      expect(after.outbox).toBe(1);
      const actor = {
        adminId: fixture.ids.adminId,
        roles: ["content_editor", "event_manager", "system_admin"],
        eventScopes: [
          fixture.ids.eventId,
          fixture.ids.ulujamEventId,
          "80202600-0000-4000-8000-000000000001",
        ],
      };
      expect((await getForm(actor, fixture.ids.formId)).title).toBe(
        "DEMO genel başvuru",
      );
      expect(
        (await getSubmission(actor, fixture.ids.submissionId)).status,
      ).toBe("pending");
      expect((await getGameEditor(actor, fixture.ids.gameId)).title).toBe(
        "DEMO görsel oyun",
      );
      expect(
        (await getUlujamPreview(actor, fixture.ids.ulujamEventId)).teams,
      ).toEqual([{ id: fixture.ids.teamId, name: "DEMO görsel takımı" }]);
      expect((await getPublicForm(fixture.slugs.form))?.state).toBe("open");
      expect((await getPublicForm(fixture.slugs.ulujamForm))?.state).toBe(
        "open",
      );
      expect(await getPublicGame(fixture.slugs.game)).toMatchObject({
        id: fixture.ids.gameId,
        title: "DEMO görsel oyun",
        credits: ["DEMO yapımcı"],
        finalist: true,
      });
      expect((await getUlujamPresentation()).application.url).toBe(
        fixture.paths.ulujamForm,
      );
    });
  },
);

it("reproduces all full-profile records and visible identifiers across two owned databases", async () => {
  const capture = () =>
    withDatabase(async (local) => {
      const fixture = await seedVisualFixture(local.sql, "full");
      return { fixture, records: await visibleFingerprint(local.sql) };
    });
  expect(await capture()).toEqual(await capture());
});

it.each(["wrong-name", "non-local-host", "database-override"] as const)(
  "rejects %s configuration before touching any non-owned database",
  async (scenario) => {
    await withDatabase(async (local) => {
      const before = await tableCounts(local.sql);
      const configured = new URL(local.url);
      if (scenario === "wrong-name")
        configured.pathname = "/uludott_working_not_contacted";
      if (scenario === "non-local-host")
        configured.hostname = "db.example.invalid";
      if (scenario === "database-override")
        configured.searchParams.set(
          "database",
          "uludott_working_not_contacted",
        );
      process.env.DATABASE_URL = configured.toString();
      await expect(seedVisualFixture(local.sql, "full")).rejects.toThrow(
        /owned local test database/,
      );
      expect(await tableCounts(local.sql)).toEqual(before);
    });
  },
);

it("rejects a dirty owned database without adding fixture records", async () => {
  await withDatabase(async (local) => {
    await local.sql`insert into events(id,title,slug,kind,created_at)
      values('0c000000-0000-4000-8000-000000000999','DEMO existing event','demo-existing-event','general',${VISUAL_FIXED_TIME})`;
    const before = await visibleFingerprint(local.sql);
    await expect(seedVisualFixture(local.sql, "full")).rejects.toThrow(
      /fresh owned local test database/,
    );
    expect(await visibleFingerprint(local.sql)).toEqual(before);
  });
});

it("rejects an application client pointing at a different owned database", async () => {
  await withDatabase(async (first) => {
    await withDatabase(async (second) => {
      const beforeFirst = await tableCounts(first.sql);
      const beforeSecond = await tableCounts(second.sql);
      await expect(seedVisualFixture(first.sql, "full")).rejects.toThrow(
        /database identities differ/,
      );
      expect(await tableCounts(first.sql)).toEqual(beforeFirst);
      expect(await tableCounts(second.sql)).toEqual(beforeSecond);
    });
  });
});

it("keeps real authentication valid under the pinned visual clock without changing working DB defaults", async () =>
  withDatabase(async (local) => {
    const fixture = await seedVisualFixture(local.sql, "full");
    const clock = vi
      .spyOn(Date, "now")
      .mockReturnValue(Date.parse("2026-10-22T12:00:00Z"));
    try {
      const session = await authenticatePanelPassword(VISUAL_PANEL_PASSWORD);
      expect(session.actor.adminId).toBe(fixture.ids.adminId);
      const [row] =
        await local.sql`select created_at,expires_at from admin_sessions where id=${session.id}`;
      expect(new Date(row.created_at).toISOString()).toBe(VISUAL_FIXED_TIME);
      expect(new Date(row.expires_at).getTime()).toBeGreaterThan(
        new Date(row.created_at).getTime(),
      );
    } finally {
      clock.mockRestore();
    }
  }));
