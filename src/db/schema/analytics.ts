import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const sitePageViews = pgTable(
  "site_page_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    path: varchar("path", { length: 255 }).notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    refererHost: text("referer_host"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("site_page_views_path_idx").on(t.path),
    index("site_page_views_created_at_idx").on(t.createdAt),
  ],
);
