import { it, expect } from "vitest";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import {
  listSiteGames,
  listPublishedSiteGames,
  saveSiteGame,
  removeSiteGame,
} from "../../src/modules/games/application/site-game-service";

// These assert visibility and default tombstones, rather than the storage representation.
it("oyun kartı taslak/yayın/sıra/düzenleme ve silme akışı mevcut kartları korur", async () => {
  const fixture = await ulujamFixture();
  try {
    const actor = { ...fixture.actor, roles: ["content_editor"] };
    const defaults = await listSiteGames(actor);
    expect(defaults.map((game) => game.title)).toEqual([
      "No Time To Die",
      "InFrame",
    ]);
    const input = {
      title: "Yeni oyun",
      label: "Yayımlanmış oyun",
      credit: "Tasarım ekibi",
      description: "Birlikte üretilen oyun.",
      image: defaults[0].image,
      alt: "Yeni oyun kapağı",
      href: "https://uludott-test.itch.io/new-game",
      position: 0,
      published: false,
    };
    const draft = await saveSiteGame(actor, input);
    expect(
      (await listPublishedSiteGames()).some((game) => game.id === draft.id),
    ).toBe(false);
    const published = await saveSiteGame(
      actor,
      { ...input, published: true },
      draft.id,
      draft.revision,
    );
    expect((await listPublishedSiteGames())[0].title).toBe("Yeni oyun");
    const updated = await saveSiteGame(
      actor,
      { ...input, title: "Düzenlenen oyun", published: true },
      published.id,
      published.revision,
    );
    expect((await listPublishedSiteGames())[0].title).toBe("Düzenlenen oyun");
    await expect(saveSiteGame(actor, input, updated.id, 1)).rejects.toThrow(
      "Sürüm çakışması",
    );
    const attempts = await Promise.allSettled([
      saveSiteGame(
        actor,
        { ...input, title: "Birinci" },
        updated.id,
        updated.revision,
      ),
      saveSiteGame(
        actor,
        { ...input, title: "İkinci" },
        updated.id,
        updated.revision,
      ),
    ]);
    expect(
      attempts.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const latest = (await listSiteGames(actor)).find(
      (game) => game.id === updated.id,
    )!;
    await removeSiteGame(actor, latest.id, latest.revision);
    await removeSiteGame(actor, defaults[0].id, 0);
    expect((await listPublishedSiteGames()).map((game) => game.title)).toEqual([
      "InFrame",
    ]);
    expect(
      (await listSiteGames(actor)).some((game) => game.id === defaults[0].id),
    ).toBe(false);
    await expect(
      saveSiteGame(actor, {
        ...input,
        image: "/community/06-oyunlar/../../outside.webp",
      }),
    ).rejects.toThrow();
    await expect(
      saveSiteGame({ ...actor, roles: ["system_admin"] }, input),
    ).rejects.toThrow("Yetki yok");
    await expect(saveSiteGame(fixture.actor, input)).rejects.toThrow(
      "Yetki yok",
    );
  } finally {
    await fixture.cleanup();
  }
});
