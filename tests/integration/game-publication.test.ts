import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { approveRoster } from "../../src/modules/teams/application/approval-service";
import {
  saveGameDraft,
  markFinalist,
  assignAward,
  publishGame,
  getGameEditor,
} from "../../src/modules/games/application/game-service";
import { approvePublicationName } from "../../src/modules/games/application/credit-consent-service";
import { getPublicGame } from "../../src/modules/games/infrastructure/game-repository";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { getDatabase } from "../../src/lib/database/client";
import { historical2026 } from "../../src/modules/games/domain/historical-result";
it("Tam yayın bilgisi, izinsiz ad, HTTPS hostname, degree yarışı ve card revision", async () => {
  const x = await ulujamFixture();
  try {
    const r = await submitUlujam(x.input("new"), randomUUID());
    await approveRoster(x.actor, r.team!.id, 2);
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    const input = {
      title: "DEMO oyun",
      slug: "demo-game",
      description: "DEMO açıklama",
      teamId: r.team!.id,
      mediaId: null,
      itchUrl: "https://demo.itch.io/game",
      credits: [{ applicationId: a.id, publicationName: "DEMO yayın adı" }],
    };
    for (const url of [
      "http://demo.itch.io/game",
      "https://itch.io.evil.test/game",
      "https://evil.test/?demo.itch.io",
      "https://demo.itch.io:444/game",
      "https://user@demo.itch.io/game",
    ])
      await expect(
        saveGameDraft(x.actor, x.eventId, { ...input, itchUrl: url }),
      ).rejects.toThrow();
    const draft = await saveGameDraft(x.actor, x.eventId, input);
    await expect(
      publishGame(x.actor, draft.id, draft.revision),
    ).rejects.toThrow(/rıza|onay/);
    const edit = await getGameEditor(x.actor, draft.id);
    expect(edit.credits[0].consented).toBe(false);
    await approvePublicationName(
      edit.credits[0].token!,
      "DEMO yayın adı",
      true,
    );
    const ready = await getGameEditor(x.actor, draft.id);
    const result = await publishGame(x.actor, draft.id, ready.revision);
    expect((await getPublicGame("demo-game"))?.credits).toEqual([
      "DEMO yayın adı",
    ]);
    expect(JSON.stringify(await getPublicGame("demo-game"))).not.toContain(
      "DEMO kişi",
    );
    await expect(
      publishGame({ ...x.actor, eventScopes: [] }, draft.id, result.revision),
    ).rejects.toThrow("Yetki yok");
    const second = await saveGameDraft(x.actor, x.eventId, {
      ...input,
      slug: "second-game",
      title: "DEMO ikinci",
      credits: [],
    });
    await expect(
      publishGame(x.actor, second.id, second.revision),
    ).rejects.toThrow();
    const awards = await Promise.allSettled([
      assignAward(x.actor, x.eventId, 1, draft.id),
      assignAward(x.actor, x.eventId, 1, second.id),
    ]);
    expect(awards.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      (await x.sql`select count(*)::int n from awards where rank=1`)[0].n,
    ).toBe(1);
    await markFinalist(x.actor, draft.id);
    expect((await x.sql`select count(*)::int n from finalists`)[0].n).toBe(1);
    expect(
      (
        await x.sql`select count(*)::int n from outbox where type='card.changed' and revision>2`
      )[0].n,
    ).toBeGreaterThan(0);
    await x.sql`update applications set status='withdrawn' where id=${a.id}`;
    await approvePublicationName(edit.credits[0].token!, "", false);
    expect(await getPublicGame("demo-game")).toBeNull();
    const latest = await getGameEditor(x.actor, draft.id);
    await saveGameDraft(x.actor, x.eventId, {
      ...input,
      id: draft.id,
      expectedRevision: latest.revision,
      credits: [
        {
          id: latest.credits[0].id,
          applicationId: a.id,
          publicationName: "DEMO farklı ad",
        },
      ],
    });
    expect(await getPublicGame("demo-game")).toBeNull();
    expect((await getGameEditor(x.actor, draft.id)).credits[0].consented).toBe(
      false,
    );
  } finally {
    await x.cleanup();
  }
});
it("2026 üç URL ve NULL alanları; kısmi istisna ve sonradan editoryal tamamlama", async () => {
  const x = await ulujamFixture();
  try {
    await seed2026Results(getDatabase());
    const actor = {
      ...x.actor,
      eventScopes: [x.eventId, historical2026.eventId],
    };
    const records =
      await x.sql`select * from games where event_id=${historical2026.eventId} order by id`;
    expect(records).toHaveLength(3);
    expect(
      records.every(
        (r) => r.title === null && r.team_id === null && r.description === null,
      ),
    ).toBe(true);
    const one = records[0];
    await publishGame(actor, one.id, one.revision);
    const edit = await getGameEditor(actor, one.id);
    const saved = await saveGameDraft(actor, historical2026.eventId, {
      id: one.id,
      expectedRevision: edit.revision,
      title: "DEMO arşiv oyun",
      slug: "demo-archive-game",
      description: "DEMO doğrulanmış açıklama",
      teamId: null,
      editorialTeamName: "DEMO doğrulanmış arşiv takımı",
      itchUrl: one.itch_url,
      mediaId: null,
      historicalPartial: false,
      credits: [
        { applicationId: null, publicationName: "DEMO arşiv yapımcısı" },
      ],
    });
    const draft = await getGameEditor(actor, saved.id);
    await approvePublicationName(
      draft.credits[0].token!,
      "DEMO arşiv yapımcısı",
      true,
    );
    const ready = await getGameEditor(actor, saved.id);
    await publishGame(actor, saved.id, ready.revision);
    expect((await getPublicGame("demo-archive-game"))?.teamName).toBe(
      "DEMO doğrulanmış arşiv takımı",
    );
    expect(
      (
        await x.sql`select itch_url from games where event_id=${historical2026.eventId}`
      )
        .map((r) => r.itch_url)
        .sort(),
    ).toEqual(records.map((r) => r.itch_url).sort());
  } finally {
    await x.cleanup();
  }
});

it("Davet başka yapımcıya devredilemez ve event manager scope zorunlu", async () => {
  const x = await ulujamFixture();
  try {
    const r = await submitUlujam(x.input("new"), randomUUID()),
      team = r.team!;
    const other = await submitUlujam(
      { ...x.input("existing"), teamId: team.id, password: team.password },
      randomUUID(),
    );
    await approveRoster(x.actor, team.id, 3);
    const [a] =
      await x.sql`select id from applications where submission_id=${r.id}`;
    const [b] =
      await x.sql`select id from applications where submission_id=${other.id}`;
    const base = {
      title: "DEMO",
      slug: "demo-scope",
      description: "DEMO bilgi",
      teamId: team.id,
      mediaId: null,
      itchUrl: "https://demo.itch.io/game",
      credits: [{ applicationId: a.id, publicationName: "DEMO A" }],
    };
    const saved = await saveGameDraft(x.actor, x.eventId, base),
      old = await getGameEditor(x.actor, saved.id),
      token = old.credits[0].token!;
    await saveGameDraft(x.actor, x.eventId, {
      ...base,
      id: saved.id,
      expectedRevision: saved.revision,
      credits: [
        {
          id: old.credits[0].id,
          applicationId: b.id,
          publicationName: "DEMO B",
        },
      ],
    });
    await expect(
      approvePublicationName(token, "DEMO eski sahip", true),
    ).rejects.toThrow(/bulunamadı/);
    await expect(
      getGameEditor({ ...x.actor, eventScopes: [] }, saved.id),
    ).rejects.toThrow("Yetki yok");
  } finally {
    await x.cleanup();
  }
});
