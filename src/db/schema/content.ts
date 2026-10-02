import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  jsonb,
  unique,
  index,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { forms } from "./forms.ts";
import { teams } from "./ulujam.ts";
import { applications } from "./ulujam.ts";

export const eventCategories = pgTable("event_categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});
export const events = pgTable(
  "events",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    kind: text("kind").notNull(),
    categoryId: uuid("category_id").references(() => eventCategories.id),
    description: text("description"),
    excerpt: text("excerpt"),
    organizer: text("organizer"),
    locationType: text("location_type").default("physical").notNull(),
    mediaId: uuid("media_id").references(() => mediaAssets.id),
    formId: uuid("form_id"),
    location: text("location"),
    startsAt: instant("starts_at"),
    endsAt: instant("ends_at"),
    publishAt: instant("publish_at"),
    unpublishAt: instant("unpublish_at"),
    status: text("status").default("draft").notNull(),
    capacity: integer("capacity"),
    maxTeamSize: integer("max_team_size").default(6).notNull(),
    revision: integer("revision").default(1).notNull(),
    seo: jsonb("seo").default({}).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "event_form_scope_fk",
      columns: [t.id, t.formId],
      foreignColumns: [forms.eventId, forms.id],
    }),
    check(
      "event_location_type",
      sql`${t.locationType} IN ('physical','online')`,
    ),
    check(
      "event_status",
      sql`${t.status} IN ('draft','scheduled','published','ended','cancelled','archived')`,
    ),
    check("event_kind", sql`${t.kind} IN ('general','ulujam')`),
    check(
      "event_dates",
      sql`${t.endsAt} IS NULL OR (${t.startsAt} IS NOT NULL AND ${t.endsAt} > ${t.startsAt})`,
    ),
    check(
      "event_publish_window",
      sql`${t.unpublishAt} IS NULL OR (${t.publishAt} IS NOT NULL AND ${t.unpublishAt} > ${t.publishAt})`,
    ),
    check("event_capacity", sql`${t.capacity} IS NULL OR ${t.capacity} > 0`),
    check("event_team_size", sql`${t.maxTeamSize} >= 1`),
    check("event_revision", sql`${t.revision} >= 1`),
    index("events_publication_idx").on(t.status, t.publishAt),
    index("events_start_idx").on(t.startsAt),
    index("events_category_idx").on(t.categoryId),
  ],
);
export const eventYears = pgTable(
  "event_years",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .unique()
      .references(() => events.id),
    year: integer("year").notNull().unique(),
  },
  (t) => [check("event_year_range", sql`${t.year} BETWEEN 2000 AND 2200`)],
);
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    originalKey: text("original_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    altText: text("alt_text"),
    status: text("status").default("private").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("media_size", sql`${t.byteSize} > 0`),
    check(
      "media_status",
      sql`${t.status} IN ('private','processing','ready','rejected','deleted')`,
    ),
  ],
);
export const mediaVariants = pgTable(
  "media_variants",
  {
    id: id(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => mediaAssets.id),
    purpose: text("purpose").notNull(),
    objectKey: text("object_key").notNull().unique(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    mimeType: text("mime_type").notNull(),
    publishedAt: instant("published_at"),
  },
  (t) => [
    unique("media_variant_purpose_unique").on(t.assetId, t.purpose),
    check("media_dimensions", sql`${t.width}>0 AND ${t.height}>0`),
  ],
);
export const announcements = pgTable(
  "announcements",
  {
    id: id(),
    eventId: uuid("event_id").references(() => events.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    body: text("body").notNull(),
    excerpt: text("excerpt"),
    seo: jsonb("seo").default({}).notNull(),
    ctaUrl: text("cta_url"),
    ctaLabel: text("cta_label"),
    mediaId: uuid("media_id").references(() => mediaAssets.id),
    status: text("status").default("draft").notNull(),
    publishAt: instant("publish_at"),
    unpublishAt: instant("unpublish_at"),
    revision: integer("revision").default(1).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "announcement_status",
      sql`${t.status} IN ('draft','scheduled','published','archived')`,
    ),
    check(
      "announcement_window",
      sql`${t.unpublishAt} IS NULL OR (${t.publishAt} IS NOT NULL AND ${t.unpublishAt}>${t.publishAt})`,
    ),
    check("announcement_revision", sql`${t.revision}>0`),
    index("announcements_publication_idx").on(t.status, t.publishAt),
    index("announcements_event_idx").on(t.eventId),
  ],
);
export const featuredSlots = pgTable(
  "featured_slots",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .unique()
      .references(() => events.id),
    position: integer("position").notNull().unique(),
    mediaId: uuid("media_id").references(() => mediaAssets.id),
  },
  (t) => [check("featured_position", sql`${t.position}>=0`)],
);
export const games = pgTable(
  "games",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    teamId: uuid("team_id"),
    slug: text("slug").unique(),
    editorialTeamName: text("editorial_team_name"),
    slugLocked: boolean("slug_locked").default(false).notNull(),
    title: text("title"),
    itchUrl: text("itch_url").notNull(),
    description: text("description"),
    mediaId: uuid("media_id").references(() => mediaAssets.id),
    historicalPartial: boolean("historical_partial").default(false).notNull(),
    publishedAt: instant("published_at"),
    revision: integer("revision").default(1).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("game_event_id_unique").on(t.eventId, t.id),
    foreignKey({
      name: "game_team_event_fk",
      columns: [t.eventId, t.teamId],
      foreignColumns: [teams.eventId, teams.id],
    }),
    check("game_revision", sql`${t.revision}>0`),
    check(
      "game_itch_url",
      sql`${t.itchUrl} ~ '^https://[a-zA-Z0-9-]+\\.itch\\.io/[A-Za-z0-9_/?=&%.-]+$'`,
    ),
    index("games_event_idx").on(t.eventId),
  ],
);
export const gameCredits = pgTable(
  "game_credits",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    applicationId: uuid("application_id").references(() => applications.id),
    publicationName: text("publication_name"),
    revision: integer("revision").default(1).notNull(),
    consentTokenHash: text("consent_token_hash").unique(),
    consentTokenEncrypted: text("consent_token_encrypted"),
    consentedAt: instant("consented_at"),
  },
  (t) => [
    check(
      "credit_consent_name",
      sql`${t.consentedAt} IS NULL OR nullif(btrim(${t.publicationName}),'') IS NOT NULL`,
    ),
    index("game_credits_game_idx").on(t.gameId),
    unique("game_credit_application_unique").on(t.gameId, t.applicationId),
    check("game_credit_revision", sql`${t.revision}>0`),
  ],
);
export const awards = pgTable(
  "awards",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    rank: integer("rank").notNull(),
  },
  (t) => [
    foreignKey({
      name: "award_game_event_fk",
      columns: [t.eventId, t.gameId],
      foreignColumns: [games.eventId, games.id],
    }),
    unique("award_event_rank_unique").on(t.eventId, t.rank),
    unique("award_game_unique").on(t.gameId),
    check("award_rank", sql`${t.rank} BETWEEN 1 AND 3`),
  ],
);
export const finalists = pgTable(
  "finalists",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    gameId: uuid("game_id")
      .notNull()
      .unique()
      .references(() => games.id),
    position: integer("position").notNull(),
  },
  (t) => [
    foreignKey({
      name: "finalist_game_event_fk",
      columns: [t.eventId, t.gameId],
      foreignColumns: [games.eventId, games.id],
    }),
    unique("finalist_event_position_unique").on(t.eventId, t.position),
    check("finalist_position", sql`${t.position}>=0`),
  ],
);

export const contentRedirects = pgTable(
  "content_redirects",
  {
    id: id(),
    contentType: text("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    oldSlug: text("old_slug").notNull(),
  },
  (t) => [
    unique("content_redirect_slug_unique").on(t.contentType, t.oldSlug),
    check(
      "content_redirect_type",
      sql`${t.contentType} IN ('event','announcement')`,
    ),
  ],
);
