import "server-only";
import { and, eq, lte, ne } from "drizzle-orm";
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
