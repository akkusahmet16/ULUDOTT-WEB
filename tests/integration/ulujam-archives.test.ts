import { it, expect } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { getDatabase } from "../../src/lib/database/client";
import {
  listArchives,
  listPublishedArchives,
  saveArchive,
} from "../../src/modules/site-settings/application/archives";
it("aynı şablona yeni yıllar eklenir, yayın ve sıra bağımsızdır; kaldırılan 2026 geri gelmez", async () => {
  const x = await ulujamFixture();
  try {
    const actor = { ...x.actor, roles: ["content_editor"] };
    const original = (await listArchives(actor))[0];
    expect(original.year).toBe(2026);
    expect(original.games.map((game) => game.title)).toEqual([
      "Lost Pieces",
      "Lost Child Soul",
      "ProjectSW",
    ]);
    const { revision: _revision, ...fields } = original;
    expect(_revision).toBe(0);
    const draft = await saveArchive(
      actor,
      {
        ...fields,
        year: 2025,
        description: "2025 topluluk arşivi",
        published: false,
      },
      0,
    );
    expect(
      (await listPublishedArchives()).map((archive) => archive.year),
    ).toEqual([2026]);
    const { revision, ...next } = draft;
    await saveArchive(
      actor,
      {
        ...next,
        published: true,
        position: 0,
        gallery: [...next.gallery].reverse(),
        games: [...next.games].reverse(),
      },
      revision,
    );
    const published = await listPublishedArchives();
    expect(published.map((archive) => archive.year)).toEqual([2025, 2026]);
    expect(published[0].gallery[0].src).toBe(original.gallery.at(-1)?.src);
    expect(published[0].games[0].rank).toBe(1);
    await saveArchive(
      actor,
      { ...fields, published: false },
      original.revision,
    );
    expect(
      (await listPublishedArchives()).map((archive) => archive.year),
    ).toEqual([2025]);
    await expect(
      saveArchive(actor, { ...fields, published: true }, 0),
    ).rejects.toThrow("Sürüm çakışması");
    await expect(
      saveArchive(
        actor,
        {
          ...fields,
          year: 2024,
          gallery: [
            { src: "/community/02-ulujam/../../outside.webp", alt: "Geçersiz" },
          ],
        },
        0,
      ),
    ).rejects.toThrow();
    await expect(
      saveArchive(
        actor,
        { ...fields, year: 2024, games: [fields.games[0], fields.games[0]] },
        0,
      ),
    ).rejects.toThrow();
  } finally {
    await x.cleanup();
  }
});

it("varsayılan 2026 arşivi eski yayın kaldırmalarını korur; kayıtlı arşiv kendi yayınıyla yönetilir", async () => {
  const x = await ulujamFixture();
  try {
    await seed2026Results(getDatabase());
    expect((await listPublishedArchives())[0].games.map((g) => g.rank)).toEqual(
      [1, 2, 3],
    );
    await x.sql`update games set published_at=null where itch_url='https://subzero-41.itch.io/lost-pieces'`;
    expect((await listPublishedArchives())[0].games.map((g) => g.rank)).toEqual(
      [2, 3],
    );
    await x.sql`update events set status='archived' where slug='ulujam-2026'`;
    expect((await listPublishedArchives())[0].games).toEqual([]);
    const actor = { ...x.actor, roles: ["content_editor"] };
    const { revision, ...fields } = (await listArchives(actor))[0];
    await saveArchive(actor, fields, revision);
    expect((await listPublishedArchives())[0].games).toHaveLength(3);
  } finally {
    await x.cleanup();
  }
});
