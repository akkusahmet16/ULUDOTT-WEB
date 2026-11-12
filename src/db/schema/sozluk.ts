import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  primaryKey,
  index,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { communityMembers } from "./community.ts";
import { admins } from "./admin.ts";

export const sozlukAuthors = pgTable(
  "sozluk_authors",
  {
    id: id(),
    memberId: uuid("member_id").references(() => communityMembers.id, {
      onDelete: "set null",
    }),
    nick: text("nick").notNull().unique(),
    normalizedNick: text("normalized_nick").notNull().unique(),
    email: text("email").notNull().unique(),
    googleSub: text("google_sub").unique(),
    passwordHash: text("password_hash"),
    rank: text("rank").default("caylak").notNull(),
    bio: text("bio").default("").notNull(),
    status: text("status").default("active").notNull(),
    mutedUntil: instant("muted_until"),
    approvedEntryCount: integer("approved_entry_count").default(0).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("sozluk_authors_nick_idx").on(t.normalizedNick),
    index("sozluk_authors_member_idx").on(t.memberId),
    check(
      "sozluk_author_rank",
      sql`${t.rank} IN ('caylak', 'yazar', 'moderator', 'admin')`,
    ),
    check(
      "sozluk_author_status",
      sql`${t.status} IN ('active', 'muted', 'banned')`,
    ),
    check("sozluk_author_approved_count", sql`${t.approvedEntryCount} >= 0`),
  ],
);

export const sozlukSessions = pgTable(
  "sozluk_sessions",
  {
    id: id(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => sozlukAuthors.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: createdAt(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
  },
  (t) => [
    index("sozluk_sessions_author_idx").on(t.authorId),
    index("sozluk_sessions_expiry_idx").on(t.expiresAt),
    check("sozluk_session_expiry", sql`${t.expiresAt} > ${t.createdAt}`),
  ],
);

export const sozlukChannels = pgTable(
  "sozluk_channels",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sozluk_channels_order_idx").on(t.sortOrder)],
);

export const sozlukTopics = pgTable(
  "sozluk_topics",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title").notNull().unique(),
    channelId: uuid("channel_id").references(() => sozlukChannels.id, {
      onDelete: "set null",
    }),
    createdByAuthorId: uuid("created_by_author_id").references(
      () => sozlukAuthors.id,
      { onDelete: "set null" },
    ),
    isLocked: boolean("is_locked").default(false).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    mergedIntoTopicId: uuid("merged_into_topic_id").references(
      (): AnyPgColumn => sozlukTopics.id,
      { onDelete: "set null" },
    ),
    entryCount: integer("entry_count").default(0).notNull(),
    lastEntryAt: instant("last_entry_at").defaultNow().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("sozluk_topics_channel_idx").on(t.channelId),
    index("sozluk_topics_last_entry_idx").on(t.lastEntryAt),
    index("sozluk_topics_normalized_idx").on(t.normalizedTitle),
    check("sozluk_topic_entry_count", sql`${t.entryCount} >= 0`),
  ],
);

export const sozlukEntries = pgTable(
  "sozluk_entries",
  {
    id: id(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => sozlukTopics.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => sozlukAuthors.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status").default("published").notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    favoritesCount: integer("favorites_count").default(0).notNull(),
    editedAt: instant("edited_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("sozluk_entries_topic_created_idx").on(t.topicId, t.createdAt),
    index("sozluk_entries_author_created_idx").on(t.authorId, t.createdAt),
    index("sozluk_entries_status_idx").on(t.status),
    check(
      "sozluk_entry_status",
      sql`${t.status} IN ('published', 'pending', 'hidden', 'deleted')`,
    ),
    check("sozluk_entry_upvotes_nonneg", sql`${t.upvotes} >= 0`),
    check("sozluk_entry_downvotes_nonneg", sql`${t.downvotes} >= 0`),
    check("sozluk_entry_favorites_nonneg", sql`${t.favoritesCount} >= 0`),
  ],
);

export const sozlukEntryVotes = pgTable(
  "sozluk_entry_votes",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => sozlukEntries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => sozlukAuthors.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.authorId] }),
    check("sozluk_entry_vote_value", sql`${t.value} IN (-1, 1)`),
  ],
);

export const sozlukEntryFavorites = pgTable(
  "sozluk_entry_favorites",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => sozlukEntries.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => sozlukAuthors.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.entryId, t.authorId] }),
    index("sozluk_favorites_author_idx").on(t.authorId),
  ],
);

export const sozlukReports = pgTable(
  "sozluk_reports",
  {
    id: id(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => sozlukEntries.id, { onDelete: "cascade" }),
    reporterAuthorId: uuid("reporter_author_id")
      .notNull()
      .references(() => sozlukAuthors.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    note: text("note").default("").notNull(),
    status: text("status").default("open").notNull(),
    resolvedByAdminId: uuid("resolved_by_admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    resolvedAt: instant("resolved_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("sozluk_reports_status_idx").on(t.status, t.createdAt),
    index("sozluk_reports_entry_idx").on(t.entryId),
    check(
      "sozluk_report_reason",
      sql`${t.reason} IN ('spam', 'harassment', 'rule_violation', 'spoiler', 'other')`,
    ),
    check(
      "sozluk_report_status",
      sql`${t.status} IN ('open', 'resolved', 'dismissed')`,
    ),
  ],
);
