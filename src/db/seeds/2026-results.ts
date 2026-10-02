import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../../lib/database/client.ts";
import { events, eventYears, games, awards } from "../schema/content.ts";
import { historical2026 as source } from "../../modules/games/domain/historical-result.ts";
export async function seed2026Results(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(80202608)`);
    await tx
      .insert(events)
      .values({
        id: source.eventId,
        title: "UluJam 2026",
        slug: source.slug,
        kind: "ulujam",
      })
      .onConflictDoNothing();
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, source.eventId));
    if (!event || event.kind !== "ulujam" || event.slug !== source.slug)
      throw Error("2026 etkinlik kaydı çakışıyor");
    await tx
      .insert(eventYears)
      .values({ id: source.yearId, eventId: source.eventId, year: 2026 })
      .onConflictDoNothing();
    const [year] = await tx
      .select()
      .from(eventYears)
      .where(eq(eventYears.year, 2026));
    if (!year || year.eventId !== source.eventId)
      throw Error("2026 yıl ilişkisi çakışıyor");
    for (const item of source.results) {
      await tx
        .insert(games)
        .values({
          id: item.id,
          eventId: source.eventId,
          itchUrl: item.itchUrl,
          historicalPartial: true,
          publishedAt: new Date(),
        })
        .onConflictDoNothing();
      const [game] = await tx.select().from(games).where(eq(games.id, item.id));
      if (
        !game ||
        game.eventId !== source.eventId ||
        game.itchUrl !== item.itchUrl
      )
        throw Error("2026 oyun kaydı çakışıyor");
      await tx
        .insert(awards)
        .values({ eventId: source.eventId, gameId: item.id, rank: item.rank })
        .onConflictDoNothing();
      const [award] = await tx
        .select()
        .from(awards)
        .where(eq(awards.gameId, item.id));
      if (
        !award ||
        award.eventId !== source.eventId ||
        award.rank !== item.rank
      )
        throw Error("2026 derece kaydı çakışıyor");
    }
  });
}
