import {
  pgTable,
  varchar,
  text,
  integer,
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
    deviceType: varchar("device_type", { length: 32 }),
    browser: varchar("browser", { length: 64 }),
    os: varchar("os", { length: 64 }),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("site_page_views_path_idx").on(t.path),
    index("site_page_views_created_at_idx").on(t.createdAt),
  ],
);

export const siteAnalyticsEvents = pgTable(
  "site_analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    eventName: varchar("event_name", { length: 128 }).notNull(),
    path: varchar("path", { length: 255 }).notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("site_analytics_events_type_idx").on(t.eventType),
    index("site_analytics_events_created_at_idx").on(t.createdAt),
    index("site_analytics_events_path_idx").on(t.path),
  ],
);
