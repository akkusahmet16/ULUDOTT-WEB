import "server-only";
import { and, eq, lte, ne, sql } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import {
  games,
  awards,
  eventYears,
  events,
} from "../../../db/schema/content.ts";
import { historical2026 } from "../domain/historical-result.ts";
export async function historicalGameRecords(year: number, now: Date) {
  return getDatabase()
    .select({ id: games.id, rank: awards.rank, itchUrl: games.itchUrl })
    .from(games)
    .innerJoin(
      awards,
      and(eq(awards.gameId, games.id), eq(awards.eventId, games.eventId)),
    )
    .innerJoin(eventYears, eq(eventYears.eventId, games.eventId))
    .innerJoin(events, eq(events.id, games.eventId))
    .where(
      and(
        eq(eventYears.year, year),
        eq(events.id, historical2026.eventId),
        eq(events.slug, historical2026.slug),
        eq(events.kind, "ulujam"),
        ne(events.status, "archived"),
        eq(games.historicalPartial, true),
        lte(games.publishedAt, now),
      ),
    )
    .orderBy(awards.rank);
}

// Yalnız tamamlanmış, güncel rızası ve katılım hakkı bulunan kayıtlar public görünür.
export async function getPublicGame(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
    return null;
  const db = getDatabase();
  const rows = await db.execute(
    sql`select g.*,e.title event_title,e.status event_status,t.name team_name,t.status team_status,aw.rank,exists(select 1 from finalists f where f.game_id=g.id) finalist,v.id variant_id,a.alt_text from games g join events e on e.id=g.event_id left join teams t on t.id=g.team_id left join awards aw on aw.game_id=g.id left join media_assets a on a.id=g.media_id and a.status='ready' left join media_variants v on v.asset_id=a.id and v.purpose='webp' and v.published_at is not null where g.slug=${slug} and g.historical_partial=false and g.published_at<=clock_timestamp() and e.status not in ('cancelled','archived')`,
  );
  const g = rows[0];
  if (!g || !g.title || !g.description) return null;
  const historical = isHistoricalGame(String(g.event_id), String(g.id));
  if (!historical && !["published", "ended"].includes(String(g.event_status)))
    return null;
  if (!g.team_name && !(historical && g.editorial_team_name)) return null;
  if (
    g.team_id &&
    !["approved", "changes_requested"].includes(String(g.team_status))
  )
    return null;
  const credits =
    await db.execute(sql`select c.publication_name,c.consented_at,c.application_id,a.status application_status,a.mode,t.status team_status,m.team_id,(ap.status='approved') member_approved,
 (a.id is not null and a.submission_id is not null and not exists(select 1 from submissions s where s.id=a.submission_id and s.expires_at>clock_timestamp())) expired from game_credits c left join applications a on a.id=c.application_id left join memberships m on m.application_id=a.id and m.left_at is null left join teams t on t.id=m.team_id left join team_approvals ap on ap.team_id=t.id and ap.revision=m.approved_revision where c.game_id=${g.id}::uuid order by c.id`);
  if (
    !credits.length ||
    credits.some(
      (c) =>
        !c.publication_name ||
        !c.consented_at ||
        (!c.application_id && !historical) ||
        (c.application_id &&
          (c.team_id !== g.team_id ||
            cardEligibility(
              {
                status: String(c.application_status),
                mode: String(c.mode),
                expired: c.expired === true,
              },
              {
                status: String(c.team_status),
                memberApproved: c.member_approved === true,
              },
            ) !== "active")),
    )
  )
    return null;
  if (g.media_id && !g.variant_id) return null;
  if (!itchUrl.safeParse(g.itch_url).success) return null;
  return {
    id: String(g.id),
    slug: String(g.slug),
    title: String(g.title),
    eventTitle: String(g.event_title),
    teamName: String(g.team_name ?? g.editorial_team_name),
    description: String(g.description),
    itchUrl: String(g.itch_url),
    credits: credits.map((c) => String(c.publication_name)),
    rank: g.rank ? Number(g.rank) : null,
    finalist: g.finalist === true,
    image: g.variant_id
      ? { url: "/media/" + g.variant_id, alt: String(g.alt_text ?? g.title) }
      : null,
  };
}
export type PublicGameView = NonNullable<
  Awaited<ReturnType<typeof getPublicGame>>
>;
export async function listPublicGames() {
  const rows = await getDatabase()
    .select({ slug: games.slug })
    .from(games)
    .where(
      and(
        eq(games.historicalPartial, false),
        lte(games.publishedAt, new Date()),
      ),
    )
    .orderBy(games.createdAt)
    .limit(100);
  const results = await Promise.all(
    rows.map((r) => (r.slug ? getPublicGame(r.slug) : null)),
  );
  return results.filter((r): r is PublicGameView => r !== null);
}

import { isHistoricalGame, itchUrl } from "../domain/game-publication.ts";
import { cardEligibility } from "../../cards/domain/card-eligibility.ts";
