import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreditConsent } from "../../src/modules/games/ui/credit-consent";
import { it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { ulujamFixture } from "../helpers/ulujam-fixture";
import { submitUlujam } from "../../src/modules/applications/application/submit-ulujam";
import { approveRoster } from "../../src/modules/teams/application/approval-service";
import {
  saveGameDraft,
  getGameEditor,
  publishGame,
  gameOptions,
  markFinalist,
} from "../../src/modules/games/application/game-service";
import {
  approvePublicationName,
  getPublicationConsent,
} from "../../src/modules/games/application/credit-consent-service";
import {
  getPublicGame,
  listPublicGames,
  historicalGameRecords,
} from "../../src/modules/games/infrastructure/game-repository";
import { getDatabase } from "../../src/lib/database/client";
import { seed2026Results } from "../../src/db/seeds/2026-results";
import { historical2026 } from "../../src/modules/games/domain/historical-result";
async function prepared() {
  const x = await ulujamFixture();
  const receipt = await submitUlujam(x.input("new"), randomUUID());
  await approveRoster(x.actor, receipt.team!.id, 2);
  const [a] =
    await x.sql`select id from applications where submission_id=${receipt.id}`;
  const input = {
    title: "DEMO",
    slug: "demo-review",
    description: "DEMO bilgi",
    teamId: receipt.team!.id,
    mediaId: null,
    itchUrl: "https://demo.itch.io/game",
    credits: [{ applicationId: a.id, publicationName: "DEMO ilk ad" }],
  };
  const draft = await saveGameDraft(x.actor, x.eventId, input);
  const editor = await getGameEditor(x.actor, draft.id);
  const token = editor.credits[0].token!;
  await approvePublicationName(token, "DEMO ilk ad", true);
  const current = await getGameEditor(x.actor, draft.id);
  await publishGame(x.actor, draft.id, current.revision);
  return { ...x, input, gameId: draft.id, token, applicationId: a.id };
}
it("Public yanıt tek snapshot kullanır; sorgu arasında verilen yeni ad yayına karışmaz", async () => {
  const x = await prepared();
  let triggered = false;
  const db = getDatabase(),
    execute = db.execute.bind(db);
  const spy = vi.spyOn(db, "execute").mockImplementation((q) => {
    const query = execute(q),
      run = query.execute.bind(query);
    query.execute = async () => {
      const result = await run();
      spy.mockRestore();
      triggered = true;
      await approvePublicationName(x.token, "DEMO yeniden onaylanan ad", true);
      return result;
    };
    return query;
  });
  try {
    const result = await getPublicGame(x.input.slug);
    expect(triggered).toBe(true);
    expect(result?.credits).toEqual(["DEMO ilk ad"]);
    expect(await getPublicGame(x.input.slug)).toBeNull();
  } finally {
    spy.mockRestore();
    await x.cleanup();
  }
});
it("Expired ve kapalı etkinlikte kayıtlı bağlantı yalnız minimal geri çekmeyi açar", async () => {
  const x = await prepared();
  try {
    await x.sql`update submissions set created_at='1999-01-01',expires_at='2000-01-01' where id=(select submission_id from applications where id=${x.applicationId})`;
    const expired = await getPublicationConsent(x.token);
    expect(expired.canApprove).toBe(false);
    expect(expired.consented).toBe(true);
    const screen = renderToStaticMarkup(
      createElement(CreditConsent, { token: x.token, initial: expired }),
    );
    expect(screen).toContain("Yayın onayımı geri çek");
    expect(screen).not.toContain("DEMO ilk ad");
    expect(JSON.stringify(expired)).not.toContain("DEMO ilk ad");
    await x.sql`update events set status='archived' where id=${x.eventId}`;
    expect((await getPublicationConsent(x.token)).canApprove).toBe(false);
    await approvePublicationName(x.token, "", false, 1);
    expect((await getPublicationConsent(x.token)).consented).toBe(false);
  } finally {
    await x.cleanup();
  }
});
it("Tamamlanan2026 derece arşivinde kalır; ilk yayından sonra adres değişmez", async () => {
  const x = await prepared();
  try {
    const g = await getGameEditor(x.actor, x.gameId);
    await expect(
      saveGameDraft(x.actor, x.eventId, {
        ...x.input,
        id: g.id,
        expectedRevision: g.revision,
        slug: "changed-address",
      }),
    ).rejects.toThrow(/adres|sabit/);
  } finally {
    await x.cleanup();
  }
});
it("Tamamlanan2026 derece ve gerçek finalist arşivden kaybolmaz", async () => {
  const x = await prepared();
  try {
    await seed2026Results(getDatabase());
    const id = historical2026.results[0].id;
    await x.sql`update games set historical_partial=false,title='DEMO tamamlandı',slug='demo-archive',description='DEMO',editorial_team_name='DEMO takım',published_at=now() where id=${id}`;
    await x.sql`insert into game_credits(game_id,publication_name,consented_at) values(${id},'DEMO arşiv adı',now())`;
    const actor = {
      ...x.actor,
      eventScopes: [...x.actor.eventScopes, historical2026.eventId],
    };
    await markFinalist(actor, id);
    expect(
      (await historicalGameRecords(2026, new Date())).map((g) => g.id),
    ).toContain(id);
    expect(
      (
        await listPublicGames({
          eventId: historical2026.eventId,
          finalistOnly: true,
        })
      ).items.map((g) => g.id),
    ).toContain(id);
  } finally {
    await x.cleanup();
  }
});
it("Public sayfalama ilk100 uygunsuz kaydı atlar ve her geçerli oyuna ulaşır", async () => {
  const x = await prepared();
  try {
    await x.sql`insert into games(event_id,id,title,slug,description,team_id,itch_url,published_at) select ${x.eventId},('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'DEMO geçersiz','invalid-'||i,'DEMO',${x.input.teamId},'https://demo.itch.io/game',now() from generate_series(1,105) i`;
    await x.sql`insert into games(event_id,id,title,slug,description,team_id,itch_url,published_at) select ${x.eventId},('10000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'DEMO geçerli','valid-'||i,'DEMO',${x.input.teamId},'https://demo.itch.io/game',now() from generate_series(1,25) i`;
    await x.sql`insert into game_credits(game_id,application_id,publication_name,consented_at) select id,${x.applicationId},'DEMO açık ad',now() from games where slug like 'valid-%'`;
    let cursor: string | undefined;
    const ids = new Set<string>();
    do {
      const page = await listPublicGames({ cursor });
      for (const g of page.items) ids.add(g.id);
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(ids.size).toBe(26);
    expect(ids.has(x.gameId)).toBe(true);
  } finally {
    await x.cleanup();
  }
});
it("Editör takım sayfaları ve seçili takım üyeleri sessiz sınıra takılmaz", async () => {
  const x = await ulujamFixture();
  try {
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size) select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,${x.eventId},'DEMO takım '||i,'demo takım '||i,6 from generate_series(1,105) i`;
    const selected = "ffffffff-ffff-4fff-8fff-ffffffffffff";
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${selected},${x.eventId},'DEMO seçili','demo seçili',6)`;
    let cursor: string | undefined;
    const ids = new Set<string>();
    do {
      const page = await gameOptions(x.actor, x.eventId, {
        teamId: selected,
        teamCursor: cursor,
      });
      for (const t of page.teams) ids.add(t.id);
      expect(page.teams.some((t) => t.id === selected)).toBe(true);
      cursor = page.nextTeamCursor ?? undefined;
    } while (cursor);
    expect(ids.size).toBe(106);
  } finally {
    await x.cleanup();
  }
});
it("Seçili takımın üyeleri etkinlikte ilk600 dışındayken de seçilebilir", async () => {
  const x = await ulujamFixture();
  try {
    const other = randomUUID(),
      selected = randomUUID();
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size) values(${other},${x.eventId},'DEMO diğer','demo diğer',6),(${selected},${x.eventId},'DEMO seçili','demo seçili',6)`;
    await x.sql`insert into applications(id,event_id,full_name,email,phone,mode) select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,${x.eventId},'DEMO üye','demo'||i||'@test.invalid','+905551234567','existing' from generate_series(1,601) i`;
    await x.sql`insert into teams(id,event_id,name,normalized_name,expected_size) select ('10000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,${x.eventId},'DEMO bölünmüş '||i,'demo bölünmüş '||i,6 from generate_series(1,101) i`;
    await x.sql`insert into memberships(event_id,team_id,application_id) select ${x.eventId},('10000000-0000-4000-8000-'||lpad(((right(id::text,12)::int-1)/6+1)::text,12,'0'))::uuid,id from applications`;
    const target = "ffffffff-ffff-4fff-8fff-ffffffffffff";
    await x.sql`insert into applications(id,event_id,full_name,email,phone,mode) values(${target},${x.eventId},'DEMO seçili üye','selected@test.invalid','+905551234567','existing')`;
    await x.sql`insert into memberships(event_id,team_id,application_id) values(${x.eventId},${selected},${target})`;
    const options = await gameOptions(x.actor, x.eventId, { teamId: selected });
    expect(options.members.map((m) => m.id)).toEqual([target]);
  } finally {
    await x.cleanup();
  }
});
it("Kapak sayfaları ve mevcut seçili kapak ilk100 dışında korunur", async () => {
  const x = await ulujamFixture();
  try {
    await x.sql`insert into media_assets(id,original_key,mime_type,byte_size,alt_text,status) select ('00000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'demo-key-'||i,'image/webp',1,'DEMO kapak '||i,'ready' from generate_series(1,105) i`;
    await x.sql`insert into media_variants(asset_id,purpose,object_key,width,height,mime_type,published_at) select id,'webp','demo-variant-'||id,1,1,'image/webp',now() from media_assets`;
    const selected = "00000000-0000-4000-8000-000000000105";
    let cursor: string | undefined;
    const ids = new Set<string>();
    do {
      const options = await gameOptions(x.actor, x.eventId, {
        mediaId: selected,
        mediaCursor: cursor,
      });
      expect(options.covers.some((c) => c.id === selected)).toBe(true);
      for (const c of options.covers) ids.add(c.id);
      cursor = options.nextMediaCursor ?? undefined;
    } while (cursor);
    expect(ids.size).toBe(105);
  } finally {
    await x.cleanup();
  }
});
