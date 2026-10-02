import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../../lib/database/client.ts";
import { events, eventYears } from "../schema/content.ts";
const id = "90202700-0000-4000-8000-000000000001";
export async function seedUlujamComingSoon(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(90202709)`);
    await tx
      .insert(events)
      .values({ id, title: "UluJam 2027", slug: "ulujam-2027", kind: "ulujam" })
      .onConflictDoNothing();
    const [event] = await tx.select().from(events).where(eq(events.id, id));
    if (!event || event.kind !== "ulujam" || event.slug !== "ulujam-2027")
      throw Error("2027 etkinlik çakışması");
    await tx
      .insert(eventYears)
      .values({ eventId: id, year: 2027 })
      .onConflictDoNothing();
    const [year] = await tx
      .select()
      .from(eventYears)
      .where(eq(eventYears.year, 2027));
    if (!year || year.eventId !== id) throw Error("2027 yıl çakışması");
  });
}
