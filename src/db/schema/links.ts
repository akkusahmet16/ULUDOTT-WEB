import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  check,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { id, instant } from "./shared.ts";
export const linkGroups = pgTable(
  "link_groups",
  {
    id: id(),
    title: text("title").notNull(),
    position: integer("position").default(0).notNull(),
    revision: integer("revision").default(1).notNull(),
  },
  (t) => [
    check("link_group_position", sql`${t.position}>=0`),
    unique("link_group_position_unique").on(t.position),
    check("link_group_revision", sql`${t.revision}>0`),
  ],
);
export const links = pgTable(
  "links",
  {
    id: id(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => linkGroups.id),
    title: text("title").notNull(),
    url: text("url").notNull(),
    icon: text("icon"),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    revision: integer("revision").default(1).notNull(),
    verifiedAt: instant("verified_at"),
    published: boolean("published").default(false).notNull(),
    featured: boolean("featured").default(false).notNull(),
    startsAt: instant("starts_at"),
    endsAt: instant("ends_at"),
  },
  (t) => [
    check("link_position", sql`${t.position}>=0`),
    unique("link_group_link_position_unique").on(t.groupId, t.position),
    check("link_revision", sql`${t.revision}>0`),
    check(
      "link_url",
      sql`${t.url} ~ '^https://[^[:space:]]+$' OR ${t.url} ~ '^/[^/[:space:]][^[:space:]]*$' OR ${t.url}='/'`,
    ),
    check(
      "link_window",
      sql`${t.endsAt} IS NULL OR (${t.startsAt} IS NOT NULL AND ${t.endsAt}>${t.startsAt})`,
    ),
    index("links_public_order_idx").on(t.groupId, t.published, t.position),
  ],
);
