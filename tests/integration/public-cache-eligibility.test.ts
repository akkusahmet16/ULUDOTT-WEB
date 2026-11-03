import { beforeEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import {
  approveRoster,
  rejectTeam,
} from "../../src/modules/teams/application/approval-service";
import {
  saveGameDraft,
  getGameEditor,
  publishGame,
  markFinalist,
} from "../../src/modules/games/application/game-service";
import { approvePublicationName } from "../../src/modules/games/application/credit-consent-service";
import { getPublicGame } from "../../src/modules/games/infrastructure/game-repository";
import { transition } from "../../src/modules/publication/service";
import { deleteOrAnonymizeExpired } from "../../src/worker/retention";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { getDatabase } from "../../src/lib/database/client";
import { historical2026 } from "../../src/modules/games/domain/historical-result";
import { listPublicHistoricalResults } from "../../src/modules/games/application/historical-results";
import {
  listArchives,
  saveArchive,
} from "../../src/modules/site-settings/application/archives";

// Only Next's persistent storage boundary is replaced outside a Next server.
// SQL, approval/consent transactions and the retention worker remain real.
const cache = vi.hoisted(() => new Map<string, string>());
vi.mock("next/cache", () => ({
  unstable_cache:
    <Args extends unknown[], Result>(
      read: (...args: Args) => Promise<Result>,
      keys: string[],
    ) =>
    async (...args: Args) => {
      const key = JSON.stringify([keys, args]);
      if (!cache.has(key)) cache.set(key, JSON.stringify(await read(...args)));
      return JSON.parse(cache.get(key)!);
    },
}));
import {
  readPublicGames,
  readPublicGame,
  readHistoricalResults,
  readPublishedArchives,
} from "../../src/modules/publication/ui/public-queries";

beforeEach(() => cache.clear());

async function publishedGame() {
  const x = await ulujamFixture();
  try {
    const receipt = await submitUlujam(x.input("new"), randomUUID());
    await approveRoster(x.actor, receipt.team!.id, 2);
    const [application] =
      await x.sql`select id from applications where submission_id=${receipt.id}`;
    const input = {
      title: "DEMO güncel oyun",
      slug: "demo-cache-eligibility",
      description: "Yalnız izole test verisi.",
      teamId: receipt.team!.id,
      mediaId: null,
      itchUrl: "https://demo.itch.io/cache-game",
      credits: [
        {
          applicationId: application.id as string,
          publicationName: "DEMO izinli yayın adı",
        },
      ],
    };
    const draft = await saveGameDraft(x.actor, x.eventId, input);
    const editor = await getGameEditor(x.actor, draft.id);
    const token = editor.credits[0].token!;
    await approvePublicationName(token, "DEMO izinli yayın adı", true);
    const ready = await getGameEditor(x.actor, draft.id);
    await publishGame(x.actor, draft.id, ready.revision);
    return {
      ...x,
      gameId: draft.id,
      input,
      token,
      submissionId: receipt.id,
      applicationId: application.id as string,
    };
  } catch (error) {
    await x.cleanup();
    throw error;
  }
}
type Fixture = Awaited<ReturnType<typeof publishedGame>>;

async function warm(x: Fixture) {
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await readPublicGames()).items.map((game) => game.id)).toContain(
      x.gameId,
    );
    expect((await readPublicGame(x.input.slug))?.credits).toEqual([
      "DEMO izinli yayın adı",
    ]);
  }
}
async function absent(x: Fixture) {
  // The repository establishes that eligibility really changed, independently
  // of the wrapper whose previous persistent snapshot could expose the name.
  expect(await getPublicGame(x.input.slug)).toBeNull();
  expect(await readPublicGame(x.input.slug)).toBeNull();
  const list = await readPublicGames();
  expect(list.items.map((game) => game.id)).not.toContain(x.gameId);
  expect(JSON.stringify(list)).not.toContain("DEMO izinli yayın adı");
}

it.each(["cancelled", "archived"] as const)(
  "sıcak liste/detay %s etkinliğin oyununu bir sonraki okumada kaldırır",
  async (status) => {
    const x = await publishedGame();
    try {
      await warm(x);
      const [event] =
        await x.sql`select revision from events where id=${x.eventId}`;
      await transition("event", x.eventId, x.actor, event.revision, status);
      await absent(x);
    } finally {
      await x.cleanup();
    }
  },
);

it.each(["team", "application", "membership", "consent"] as const)(
  "sıcak oyun çıktısı %s uygunluğu kaybolunca eski yayın adını vermez",
  async (change) => {
    const x = await publishedGame();
    try {
      await warm(x);
      if (change === "team") {
        const [team] =
          await x.sql`select roster_revision from teams where id=${x.input.teamId}`;
        await rejectTeam(
          x.actor,
          x.input.teamId,
          "DEMO test kararı",
          team.roster_revision,
        );
      } else if (change === "application") {
        await x.sql`update applications set status='withdrawn' where id=${x.applicationId}`;
      } else if (change === "membership") {
        await x.sql`update memberships set left_at=clock_timestamp() where application_id=${x.applicationId} and team_id=${x.input.teamId}`;
      } else {
        await approvePublicationName(x.token, "", false);
      }
      await absent(x);
    } finally {
      await x.cleanup();
    }
  },
);

it("hiç mutasyon veya invalidation olmadan DB saatiyle dolan saklama süresi eski adı kaldırır", async () => {
  const x = await publishedGame();
  try {
    await x.sql`update submissions set expires_at=clock_timestamp()+interval '1 second' where id=${x.submissionId}`;
    await warm(x);
    await vi.waitFor(
      async () => {
        const [row] =
          await x.sql`select expires_at<=clock_timestamp() as expired from submissions where id=${x.submissionId}`;
        expect(row.expired).toBe(true);
      },
      { timeout: 5000, interval: 50 },
    );
    await absent(x);
  } finally {
    await x.cleanup();
  }
});

it("Next invalidation çağırmayan retention worker sonrası sıcak çıktıda silinen yapımcı kalmaz", async () => {
  const x = await publishedGame();
  try {
    await warm(x);
    await x.sql`update submissions set created_at='1999-01-01',expires_at='2000-01-01' where id=${x.submissionId}`;
    expect(await deleteOrAnonymizeExpired(new Date())).toMatchObject({
      deleted: 1,
      anonymized: 1,
    });
    const [credit] =
      await x.sql`select publication_name,consented_at from game_credits where game_id=${x.gameId}`;
    expect(credit).toEqual({ publication_name: null, consented_at: null });
    await absent(x);
  } finally {
    await x.cleanup();
  }
});

it("sıcak çıktı değişen yayın adını veya finalist durumunu önceki snapshot'tan sunmaz", async () => {
  const x = await publishedGame();
  try {
    await warm(x);
    const before = await getGameEditor(x.actor, x.gameId);
    await markFinalist(x.actor, x.gameId, before.revision, true);
    expect((await readPublicGame(x.input.slug))?.finalist).toBe(true);
    await approvePublicationName(x.token, "DEMO yenilenen yayın adı", true);
    await absent(x);
    const ready = await getGameEditor(x.actor, x.gameId);
    await publishGame(x.actor, x.gameId, ready.revision);
    expect((await readPublicGame(x.input.slug))?.credits).toEqual([
      "DEMO yenilenen yayın adı",
    ]);
    expect(
      (await readPublicGames()).items.find((game) => game.id === x.gameId)
        ?.credits,
    ).toEqual(["DEMO yenilenen yayın adı"]);
  } finally {
    await x.cleanup();
  }
});

it.each(["cancelled", "archived"] as const)(
  "tarihî sonuç ve varsayılan arşiv %s olayında tazedir; kayıtlı editoryal arşiv bağımsızdır",
  async (status) => {
    const x = await ulujamFixture();
    try {
      await seed2026Results(getDatabase());
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(
          (await readHistoricalResults(2026)).map((game) => game.rank),
        ).toEqual([1, 2, 3]);
        expect(
          (await readPublishedArchives())[0].games.map((game) => game.rank),
        ).toEqual([1, 2, 3]);
      }
      await x.sql`update events set status=${status} where id=${historical2026.eventId}`;
      expect(await listPublicHistoricalResults(2026)).toEqual([]);
      expect(await readHistoricalResults(2026)).toEqual([]);
      expect((await readPublishedArchives())[0].games).toEqual([]);
      const actor = { ...x.actor, roles: ["content_editor"] };
      const { revision, ...fields } = (await listArchives(actor))[0];
      await saveArchive(actor, fields, revision);
      expect(
        (await readPublishedArchives())[0].games.map((game) => game.title),
      ).toEqual(["Lost Pieces", "Lost Child Soul", "ProjectSW"]);
    } finally {
      await x.cleanup();
    }
  },
);

it("tam tarihî oyunun rızası geri çekilince özel ad gider, onaylı minimal derece bağlantısı kalır", async () => {
  const x = await ulujamFixture();
  try {
    await seed2026Results(getDatabase());
    const id = historical2026.results[0].id;
    const actor = {
      ...x.actor,
      eventScopes: [...x.actor.eventScopes, historical2026.eventId],
    };
    const original = await getGameEditor(actor, id);
    await saveGameDraft(actor, historical2026.eventId, {
      id,
      expectedRevision: original.revision,
      title: "DEMO tam tarihî oyun",
      slug: "demo-historical-cache",
      description: "DEMO",
      teamId: null,
      editorialTeamName: "DEMO editoryal takım",
      mediaId: null,
      itchUrl: "https://subzero-41.itch.io/lost-pieces",
      historicalPartial: false,
      credits: [
        { applicationId: null, publicationName: "DEMO tarihî yapımcı" },
      ],
    });
    const editor = await getGameEditor(actor, id);
    await approvePublicationName(
      editor.credits[0].token!,
      "DEMO tarihî yapımcı",
      true,
    );
    const ready = await getGameEditor(actor, id);
    await publishGame(actor, id, ready.revision);
    expect((await readPublicGame("demo-historical-cache"))?.credits).toEqual([
      "DEMO tarihî yapımcı",
    ]);
    expect((await readPublicGames()).items.map((game) => game.id)).toContain(
      id,
    );
    expect(
      (await readHistoricalResults(2026)).map((game) => game.rank),
    ).toEqual([1, 2, 3]);
    await readPublishedArchives();
    await approvePublicationName(editor.credits[0].token!, "", false);
    expect(await readPublicGame("demo-historical-cache")).toBeNull();
    expect(
      (await readPublicGames()).items.map((game) => game.id),
    ).not.toContain(id);
    const results = await readHistoricalResults(2026);
    expect(results[0]).toMatchObject({
      rank: 1,
      itchUrl: "https://subzero-41.itch.io/lost-pieces",
      title: null,
      credits: null,
    });
    expect((await readPublishedArchives())[0].games[0].title).toBe(
      "Lost Pieces",
    );
  } finally {
    await x.cleanup();
  }
});
