import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  uuid,
} from "drizzle-orm/pg-core";
export const siteGameEntries = pgTable(
  "site_game_entries",
  {
    id: uuid("id").primaryKey(),
    data: jsonb("data").notNull(),
    revision: integer("revision").notNull().default(1),
    deleted: boolean("deleted").notNull().default(false),
  },
  (t) => [check("site_game_entries_revision", sql`${t.revision}>0`)],
);
