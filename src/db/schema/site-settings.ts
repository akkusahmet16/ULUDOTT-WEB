import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
export const siteSettings = pgTable(
  "site_settings",
  {
    key: text("key").primaryKey(),
    data: jsonb("data").notNull(),
    revision: integer("revision").notNull().default(1),
  },
  (t) => [check("site_settings_revision", sql`${t.revision}>0`)],
);
