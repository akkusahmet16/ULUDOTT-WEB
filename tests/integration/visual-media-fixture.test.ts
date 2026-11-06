import { it, expect } from "vitest";
import { createTestDatabase } from "../helpers/local-database.ts";
import { migrateEmptyDatabase } from "../../src/lib/database/migrate.ts";
import { closeDatabase } from "../../src/lib/database/client.ts";
import { seedVisualFixture } from "../helpers/visual-fixture.ts";
import { seedVisualMediaFixture } from "../helpers/visual-media-fixture.ts";
import { getPublicGame } from "../../src/modules/games/infrastructure/game-repository.ts";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

async function owned(
  work: (
    local: Awaited<ReturnType<typeof createTestDatabase>>,
  ) => Promise<void>,
) {
  const previous = process.env.DATABASE_URL;
  const local = await createTestDatabase();
  try {
    await closeDatabase();
    process.env.DATABASE_URL = local.url;
    await migrateEmptyDatabase();
    await work(local);
  } finally {
    try {
      await closeDatabase();
      await local.cleanup();
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  }
}

it("extends full visual data using exact approved poster bytes and published/private variants", async () =>
  owned(async (local) => {
    const fixture = await seedVisualFixture(local.sql, "full");
    const media = await seedVisualMediaFixture(local.sql);
    expect(media.variants).toHaveLength(3);
    for (const variant of media.variants) {
      const bytes = await readFile("public" + variant.publicPath);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        variant.sha256,
      );
      expect([variant.width, variant.height]).toEqual([1080, 1350]);
    }
    const [counts] =
      await local.sql`select (select count(*)::int from media_assets) as assets,(select count(*)::int from media_variants where published_at is not null) as published`;
    expect(counts).toEqual({ assets: 2, published: 2 });
    const game = await getPublicGame(fixture.slugs.game);
    expect(game?.image?.url).toBe(
      "/media/" + media.variants.find((v) => v.purpose === "webp")?.id,
    );
    const [event] =
      await local.sql`select media_id from events where id=${fixture.ids.eventId}`;
    expect(event.media_id).toBe(media.assets.published);
    const [fallback] =
      await local.sql`select media_id from events where id=${fixture.ids.pastSecondEventId}`;
    expect(fallback.media_id).toBeNull();
    // Repeated setup must reject rather than replacing an existing fixture.
    await expect(seedVisualMediaFixture(local.sql)).rejects.toThrow(
      "UNEXTENDED_FULL_FIXTURE",
    );
  }));

it("rejects an unpopulated owned database without creating media metadata", async () =>
  owned(async (local) => {
    await expect(seedVisualMediaFixture(local.sql)).rejects.toThrow(
      "UNEXTENDED_FULL_FIXTURE",
    );
    const [row] =
      await local.sql`select count(*)::int as count from media_assets`;
    expect(row.count).toBe(0);
  }));
