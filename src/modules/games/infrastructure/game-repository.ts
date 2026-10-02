import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
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
        ne(events.status, "cancelled"),
        sql`(${games.historicalPartial}=false or ${games.publishedAt}<=${now.toISOString()}::timestamptz)`,
      ),
    )
    .orderBy(awards.rank);
}

// Oyun ve ad onayı aynı SQL snapshot'ından okunur. Uygunluk LIMIT'ten öncedir.
function publicQuery() {
  const historicalIds = sql.join(
    historical2026.results.map((r) => sql`${r.id}::uuid`),
    sql`, `,
  );
  return sql`select g.*,e.title event_title,e.status event_status,t.name team_name,t.status team_status,aw.rank,
 exists(select 1 from finalists f where f.game_id=g.id) finalist,v.id variant_id,a.alt_text,cr.credits
 from games g join events e on e.id=g.event_id left join teams t on t.id=g.team_id
 left join awards aw on aw.game_id=g.id left join media_assets a on a.id=g.media_id and a.status='ready'
 left join media_variants v on v.asset_id=a.id and v.purpose='webp' and v.published_at is not null
 join lateral (
 select jsonb_agg(jsonb_build_object('publication_name',c.publication_name,'consented_at',c.consented_at,
 'application_id',c.application_id,'application_status',p.status,'mode',p.mode,'team_status',mt.status,
 'team_id',m.team_id,'member_approved',ap.status='approved','expired',
 p.submission_id is not null and not exists(select 1 from submissions s where s.id=p.submission_id and s.expires_at>clock_timestamp())) order by c.id) credits,
 count(*)>0 and bool_and((c.publication_name is not null and c.consented_at is not null and
 ((c.application_id is null and g.event_id=${historical2026.eventId}::uuid and g.id in (${historicalIds})) or
 (p.id is not null and p.mode<>'solo' and p.status not in ('rejected','withdrawn') and m.team_id=g.team_id
 and mt.status in ('approved','changes_requested') and ap.status='approved'
 and (p.submission_id is null or exists(select 1 from submissions s where s.id=p.submission_id and s.expires_at>clock_timestamp()))))) IS TRUE) eligible
 from game_credits c left join applications p on p.id=c.application_id
 left join memberships m on m.application_id=p.id and m.left_at is null left join teams mt on mt.id=m.team_id
 left join team_approvals ap on ap.team_id=mt.id and ap.revision=m.approved_revision where c.game_id=g.id
 ) cr on cr.eligible=true
 where g.historical_partial=false and g.published_at<=clock_timestamp() and e.status not in ('cancelled','archived')
 and (e.status in ('published','ended') or (g.event_id=${historical2026.eventId}::uuid and g.id in (${historicalIds})))
 and g.title is not null and g.slug is not null and g.description is not null
 and ((t.status in ('approved','changes_requested')) or (g.team_id is null and g.editorial_team_name is not null and g.event_id=${historical2026.eventId}::uuid and g.id in (${historicalIds})))
 and (g.media_id is null or (v.id is not null and a.alt_text is not null))`;
}
function publicView(g: Record<string, unknown> | undefined) {
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
  const credits = g.credits as Record<string, unknown>[];
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
export async function getPublicGame(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
    return null;
  const rows = await getDatabase().execute(
    sql`${publicQuery()} and g.slug=${slug}`,
  );
  return publicView(rows[0]);
}
export async function getPublicGameById(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const rows = await getDatabase().execute(
    sql`${publicQuery()} and g.id=${id}::uuid`,
  );
  return publicView(rows[0]);
}
export type PublicGameView = NonNullable<
  Awaited<ReturnType<typeof getPublicGame>>
>;
export async function listPublicGames(
  options: { cursor?: string; eventId?: string; finalistOnly?: boolean } = {},
) {
  if (
    (options.cursor && !z.uuid().safeParse(options.cursor).success) ||
    (options.eventId && !z.uuid().safeParse(options.eventId).success)
  )
    return { items: [], nextCursor: null };
  const rows = await getDatabase().execute(sql`${publicQuery()}
 ${options.cursor ? sql`and g.id>${options.cursor}::uuid` : sql``}
 ${options.eventId ? sql`and g.event_id=${options.eventId}::uuid` : sql``}
 ${options.finalistOnly ? sql`and exists(select 1 from finalists f where f.game_id=g.id)` : sql``}
 order by g.id limit 21`);
  return {
    items: rows
      .slice(0, 20)
      .map(publicView)
      .filter((g): g is PublicGameView => g !== null),
    nextCursor: rows.length > 20 ? String(rows[19].id) : null,
  };
}
import { z } from "zod";
import { isHistoricalGame, itchUrl } from "../domain/game-publication.ts";
import { cardEligibility } from "../../cards/domain/card-eligibility.ts";
