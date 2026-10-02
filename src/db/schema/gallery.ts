import { sql } from "drizzle-orm";
import { pgTable, uuid, integer, unique, check } from "drizzle-orm/pg-core";
import { id, instant } from "./shared.ts";
import { events, mediaAssets } from "./content.ts";
export const eventGallery = pgTable(
  "event_gallery",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id),
    position: integer("position").notNull(),
    verifiedAt: instant("verified_at"),
    revision: integer("revision").notNull().default(1),
  },
  (t) => [
    unique("gallery_event_position").on(t.eventId, t.position),
    check("gallery_position", sql`${t.position} between 0 and 49`),
    check("gallery_revision", sql`${t.revision}>0`),
  ],
);
