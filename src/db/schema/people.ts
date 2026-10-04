import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const peopleOverrides = pgTable(
  "people_overrides",
  {
    slot: text("slot").primaryKey(),
    data: jsonb("data").notNull(),
    revision: integer("revision").default(1).notNull(),
  },
  (t) => [check("people_overrides_revision", sql`${t.revision}>0`)],
);
