import "server-only";
import { sql } from "drizzle-orm";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { getPublicEvents } from "./event-service.ts";
import {
  coffeeTalkEndsAt,
  coffeeTalkEventId,
} from "../domain/legacy-coffee-talk.ts";

export async function shouldShowLegacyCoffeeTalk(now = new Date()) {
  if (now < coffeeTalkEndsAt) return false;
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select id from events where slug='coffee-talk' or id=${coffeeTalkEventId} or id in (select content_id from content_redirects where content_type='event' and old_slug='coffee-talk') limit 1`,
    );
    return rows.length === 0;
  });
}

export async function getHomeEvents(now = new Date()) {
  const [items, showLegacyCoffeeTalk] = await Promise.all([
    getPublicEvents(now),
    shouldShowLegacyCoffeeTalk(now),
  ]);
  const visible = items.filter((event) => event.displayStatus !== "cancelled");
  const upcoming = visible
    .filter((event) => event.displayStatus !== "ended" && event.startsAt)
    .sort(
      (a, b) =>
        a.startsAt!.getTime() - b.startsAt!.getTime() ||
        a.id.localeCompare(b.id),
    );
  const past = visible
    .filter((event) => event.displayStatus === "ended")
    .sort(
      (a, b) =>
        ((b.endsAt ?? b.startsAt)?.getTime() ?? 0) -
          ((a.endsAt ?? a.startsAt)?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
    );
  return {
    upcoming,
    past,
    showLegacyCoffeeTalk,
  };
}
