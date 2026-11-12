import "server-only";
import { and, desc, eq, gte, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import {
  sozlukAuthors,
  sozlukChannels,
  sozlukEntries,
  sozlukEntryFavorites,
  sozlukEntryVotes,
  sozlukReports,
  sozlukSessions,
  sozlukTopics,
} from "../../../db/schema/sozluk.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
import type { SozlukReportReason } from "../domain/validation.ts";

export const DEFAULT_SOZLUK_CHANNELS = [
  { slug: "gundem", name: "gündem", description: "toplulukta konuşulanlar", sortOrder: 1 },
  { slug: "oyun-gelistirme", name: "oyun geliştirme", description: "motorlar, kod, tasarım", sortOrder: 2 },
  { slug: "ulujam", name: "ulujam", description: "game jam anıları ve oyunları", sortOrder: 3 },
  { slug: "kampus", name: "kampüs", description: "uludağ ve görükle yaşamı", sortOrder: 4 },
  { slug: "fanzin", name: "fanzin", description: "sayılar, yazılar, çizimler", sortOrder: 5 },
  { slug: "geyik", name: "geyik", description: "serbest muhabbet", sortOrder: 6 },
] as const;

export async function ensureDefaultChannels(tx: DbTx) {
  for (const ch of DEFAULT_SOZLUK_CHANNELS) {
    await tx
      .insert(sozlukChannels)
      .values({
        slug: ch.slug,
        name: ch.name,
        description: ch.description,
        sortOrder: ch.sortOrder,
        isActive: true,
      })
      .onConflictDoNothing({ target: sozlukChannels.slug });
  }
}

export async function listActiveChannels(tx: DbTx) {
  return tx
    .select()
    .from(sozlukChannels)
    .where(eq(sozlukChannels.isActive, true))
    .orderBy(sozlukChannels.sortOrder, sozlukChannels.name);
}

export async function findAuthorById(tx: DbTx, authorId: string) {
  const [row] = await tx
    .select()
    .from(sozlukAuthors)
    .where(eq(sozlukAuthors.id, authorId))
    .limit(1);
  return row ?? null;
}

export async function findAuthorByNick(tx: DbTx, normalizedNick: string) {
  const [row] = await tx
    .select()
    .from(sozlukAuthors)
    .where(eq(sozlukAuthors.normalizedNick, normalizedNick))
    .limit(1);
  return row ?? null;
}

export async function findAuthorByIdentifier(
  tx: DbTx,
  normalizedIdentifier: string,
) {
  const [row] = await tx
    .select()
    .from(sozlukAuthors)
    .where(
      or(
        eq(sozlukAuthors.normalizedNick, normalizedIdentifier),
        eq(sozlukAuthors.email, normalizedIdentifier),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function findAuthorByGoogleSub(tx: DbTx, googleSub: string) {
  const [row] = await tx
    .select()
    .from(sozlukAuthors)
    .where(eq(sozlukAuthors.googleSub, googleSub))
    .limit(1);
  return row ?? null;
}

export async function linkAuthorGoogleSub(
  tx: DbTx,
  authorId: string,
  googleSub: string,
) {
  await tx
    .update(sozlukAuthors)
    .set({ googleSub })
    .where(eq(sozlukAuthors.id, authorId));
}

export async function insertAuthor(
  tx: DbTx,
  input: {
    nick: string;
    normalizedNick: string;
    email: string;
    googleSub?: string | null;
    passwordHash?: string | null;
    bio: string;
    rank?: string;
  },
) {
  const [row] = await tx
    .insert(sozlukAuthors)
    .values({
      nick: input.nick,
      normalizedNick: input.normalizedNick,
      email: input.email,
      googleSub: input.googleSub ?? null,
      passwordHash: input.passwordHash ?? null,
      bio: input.bio,
      rank: input.rank ?? "yazar",
    })
    .returning();
  return row!;
}

export async function insertAuthorSession(
  tx: DbTx,
  input: { authorId: string; tokenHash: string; expiresAt: Date },
) {
  const [row] = await tx
    .insert(sozlukSessions)
    .values({
      authorId: input.authorId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })
    .returning();
  return row!;
}

export async function findActiveAuthorSession(tx: DbTx, tokenHash: string) {
  const [row] = await tx
    .select({
      session: sozlukSessions,
      author: sozlukAuthors,
    })
    .from(sozlukSessions)
    .innerJoin(sozlukAuthors, eq(sozlukSessions.authorId, sozlukAuthors.id))
    .where(
      and(
        eq(sozlukSessions.tokenHash, tokenHash),
        isNull(sozlukSessions.revokedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function revokeAuthorSessionByTokenHash(
  tx: DbTx,
  tokenHash: string,
) {
  await tx
    .update(sozlukSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sozlukSessions.tokenHash, tokenHash),
        isNull(sozlukSessions.revokedAt),
      ),
    );
}

export async function listLeftFrameTopics(
  tx: DbTx,
  opts: {
    mode: "gundem" | "bugun" | "kanal";
    channelSlug?: string;
    limit?: number;
  },
) {
  const limit = opts.limit ?? 35;
  const conditions = [isNull(sozlukTopics.mergedIntoTopicId)];

  if (opts.mode === "bugun") {
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    conditions.push(gte(sozlukTopics.lastEntryAt, since));
  }

  if (opts.channelSlug) {
    const [channel] = await tx
      .select({ id: sozlukChannels.id })
      .from(sozlukChannels)
      .where(eq(sozlukChannels.slug, opts.channelSlug))
      .limit(1);
    if (channel) {
      conditions.push(eq(sozlukTopics.channelId, channel.id));
    }
  }

  return tx
    .select({
      id: sozlukTopics.id,
      slug: sozlukTopics.slug,
      title: sozlukTopics.title,
      entryCount: sozlukTopics.entryCount,
      isPinned: sozlukTopics.isPinned,
      isLocked: sozlukTopics.isLocked,
      lastEntryAt: sozlukTopics.lastEntryAt,
    })
    .from(sozlukTopics)
    .where(and(...conditions))
    .orderBy(
      desc(sozlukTopics.isPinned),
      opts.mode === "gundem"
        ? desc(sozlukTopics.entryCount)
        : desc(sozlukTopics.lastEntryAt),
      desc(sozlukTopics.lastEntryAt),
    )
    .limit(limit);
}

export async function searchTopicsByQuery(
  tx: DbTx,
  query: string,
  limit = 15,
) {
  const escaped = query.trim();
  if (!escaped) return [];
  return tx
    .select({
      id: sozlukTopics.id,
      slug: sozlukTopics.slug,
      title: sozlukTopics.title,
      entryCount: sozlukTopics.entryCount,
    })
    .from(sozlukTopics)
    .where(
      and(
        isNull(sozlukTopics.mergedIntoTopicId),
        ilike(sozlukTopics.title, `%${escaped}%`),
      ),
    )
    .orderBy(desc(sozlukTopics.entryCount), desc(sozlukTopics.lastEntryAt))
    .limit(limit);
}

export async function getRandomTopicSlug(tx: DbTx): Promise<string | null> {
  const [row] = await tx
    .select({ slug: sozlukTopics.slug })
    .from(sozlukTopics)
    .where(isNull(sozlukTopics.mergedIntoTopicId))
    .orderBy(sql`random()`)
    .limit(1);
  return row?.slug ?? null;
}

export async function findTopicBySlug(tx: DbTx, slug: string) {
  const [row] = await tx
    .select({
      topic: sozlukTopics,
      channel: sozlukChannels,
    })
    .from(sozlukTopics)
    .leftJoin(sozlukChannels, eq(sozlukTopics.channelId, sozlukChannels.id))
    .where(eq(sozlukTopics.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function findTopicByNormalizedTitle(
  tx: DbTx,
  normalizedTitle: string,
) {
  const [row] = await tx
    .select()
    .from(sozlukTopics)
    .where(eq(sozlukTopics.normalizedTitle, normalizedTitle))
    .limit(1);
  return row ?? null;
}

export async function createTopic(
  tx: DbTx,
  input: {
    slug: string;
    title: string;
    normalizedTitle: string;
    channelId: string | null;
    createdByAuthorId: string;
  },
) {
  const [row] = await tx
    .insert(sozlukTopics)
    .values({
      slug: input.slug,
      title: input.title,
      normalizedTitle: input.normalizedTitle,
      channelId: input.channelId,
      createdByAuthorId: input.createdByAuthorId,
      entryCount: 0,
      lastEntryAt: new Date(),
    })
    .returning();
  return row!;
}

export async function findChannelBySlug(tx: DbTx, slug: string) {
  const [row] = await tx
    .select()
    .from(sozlukChannels)
    .where(eq(sozlukChannels.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function listTopicEntries(
  tx: DbTx,
  opts: {
    topicId: string;
    filter: "all" | "sukela" | "today";
    page: number;
    pageSize: number;
  },
) {
  const conditions = [
    eq(sozlukEntries.topicId, opts.topicId),
    eq(sozlukEntries.status, "published"),
  ];
  if (opts.filter === "today") {
    conditions.push(
      gte(sozlukEntries.createdAt, new Date(Date.now() - 24 * 60 * 60_000)),
    );
  }

  const [{ total }] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(sozlukEntries)
    .where(and(...conditions));

  const orderClause =
    opts.filter === "sukela"
      ? [
          desc(sql`${sozlukEntries.upvotes} - ${sozlukEntries.downvotes}`),
          sozlukEntries.createdAt,
        ]
      : [sozlukEntries.createdAt];

  const rows = await tx
    .select({
      entry: sozlukEntries,
      author: {
        id: sozlukAuthors.id,
        nick: sozlukAuthors.nick,
        rank: sozlukAuthors.rank,
      },
    })
    .from(sozlukEntries)
    .innerJoin(sozlukAuthors, eq(sozlukEntries.authorId, sozlukAuthors.id))
    .where(and(...conditions))
    .orderBy(...orderClause)
    .limit(opts.pageSize)
    .offset((opts.page - 1) * opts.pageSize);

  return { total: total ?? 0, rows };
}

export async function listPopularStreamEntries(tx: DbTx, limit = 12) {
  return tx
    .select({
      entry: sozlukEntries,
      author: {
        id: sozlukAuthors.id,
        nick: sozlukAuthors.nick,
        rank: sozlukAuthors.rank,
      },
      topic: {
        id: sozlukTopics.id,
        slug: sozlukTopics.slug,
        title: sozlukTopics.title,
      },
    })
    .from(sozlukEntries)
    .innerJoin(sozlukAuthors, eq(sozlukEntries.authorId, sozlukAuthors.id))
    .innerJoin(sozlukTopics, eq(sozlukEntries.topicId, sozlukTopics.id))
    .where(
      and(
        eq(sozlukEntries.status, "published"),
        isNull(sozlukTopics.mergedIntoTopicId),
      ),
    )
    .orderBy(
      desc(sql`${sozlukEntries.upvotes} - ${sozlukEntries.downvotes}`),
      desc(sozlukEntries.createdAt),
    )
    .limit(limit);
}

export async function getViewerEntryStates(
  tx: DbTx,
  authorId: string,
  entryIds: string[],
) {
  if (entryIds.length === 0) {
    return {
      votes: new Map<string, 1 | -1>(),
      favorites: new Set<string>(),
    };
  }
  const [voteRows, favRows] = await Promise.all([
    tx
      .select({
        entryId: sozlukEntryVotes.entryId,
        value: sozlukEntryVotes.value,
      })
      .from(sozlukEntryVotes)
      .where(
        and(
          eq(sozlukEntryVotes.authorId, authorId),
          inArray(sozlukEntryVotes.entryId, entryIds),
        ),
      ),
    tx
      .select({ entryId: sozlukEntryFavorites.entryId })
      .from(sozlukEntryFavorites)
      .where(
        and(
          eq(sozlukEntryFavorites.authorId, authorId),
          inArray(sozlukEntryFavorites.entryId, entryIds),
        ),
      ),
  ]);

  const votes = new Map<string, 1 | -1>();
  for (const v of voteRows) {
    if (v.value === 1 || v.value === -1) votes.set(v.entryId, v.value);
  }
  const favorites = new Set<string>(favRows.map((f) => f.entryId));
  return { votes, favorites };
}

export async function insertEntry(
  tx: DbTx,
  input: {
    topicId: string;
    authorId: string;
    content: string;
    status?: "published" | "pending";
  },
) {
  const status = input.status ?? "published";
  const [entry] = await tx
    .insert(sozlukEntries)
    .values({
      topicId: input.topicId,
      authorId: input.authorId,
      content: input.content,
      status,
    })
    .returning();

  if (status === "published") {
    await tx
      .update(sozlukTopics)
      .set({
        entryCount: sql`${sozlukTopics.entryCount} + 1`,
        lastEntryAt: new Date(),
      })
      .where(eq(sozlukTopics.id, input.topicId));
  }

  return entry!;
}

export async function findEntryById(tx: DbTx, entryId: string) {
  const [row] = await tx
    .select()
    .from(sozlukEntries)
    .where(eq(sozlukEntries.id, entryId))
    .limit(1);
  return row ?? null;
}

export async function updateEntryContent(
  tx: DbTx,
  entryId: string,
  content: string,
) {
  const [row] = await tx
    .update(sozlukEntries)
    .set({ content, editedAt: new Date() })
    .where(eq(sozlukEntries.id, entryId))
    .returning();
  return row ?? null;
}

export async function softDeleteEntryRecord(tx: DbTx, entryId: string) {
  const [existing] = await tx
    .select()
    .from(sozlukEntries)
    .where(and(eq(sozlukEntries.id, entryId), ne(sozlukEntries.status, "deleted")))
    .limit(1);
  if (!existing) return null;

  await tx
    .update(sozlukEntries)
    .set({ status: "deleted" })
    .where(eq(sozlukEntries.id, entryId));

  if (existing.status === "published") {
    await tx
      .update(sozlukTopics)
      .set({ entryCount: sql`GREATEST(${sozlukTopics.entryCount} - 1, 0)` })
      .where(eq(sozlukTopics.id, existing.topicId));
  }
  return existing;
}

export async function upsertEntryVote(
  tx: DbTx,
  entryId: string,
  authorId: string,
  nextValue: -1 | 0 | 1,
) {
  const [existing] = await tx
    .select()
    .from(sozlukEntryVotes)
    .where(
      and(
        eq(sozlukEntryVotes.entryId, entryId),
        eq(sozlukEntryVotes.authorId, authorId),
      ),
    )
    .limit(1);

  const prev = existing?.value ?? 0;
  if (prev === nextValue) {
    const entry = await findEntryById(tx, entryId);
    return {
      upvotes: entry?.upvotes ?? 0,
      downvotes: entry?.downvotes ?? 0,
      userVote: prev as -1 | 0 | 1,
    };
  }

  let upDelta = 0;
  let downDelta = 0;
  if (prev === 1) upDelta -= 1;
  if (prev === -1) downDelta -= 1;
  if (nextValue === 1) upDelta += 1;
  if (nextValue === -1) downDelta += 1;

  if (nextValue === 0 && existing) {
    await tx
      .delete(sozlukEntryVotes)
      .where(
        and(
          eq(sozlukEntryVotes.entryId, entryId),
          eq(sozlukEntryVotes.authorId, authorId),
        ),
      );
  } else if (nextValue !== 0) {
    await tx
      .insert(sozlukEntryVotes)
      .values({ entryId, authorId, value: nextValue })
      .onConflictDoUpdate({
        target: [sozlukEntryVotes.entryId, sozlukEntryVotes.authorId],
        set: { value: nextValue },
      });
  }

  const [updated] = await tx
    .update(sozlukEntries)
    .set({
      upvotes: sql`GREATEST(${sozlukEntries.upvotes} + ${upDelta}, 0)`,
      downvotes: sql`GREATEST(${sozlukEntries.downvotes} + ${downDelta}, 0)`,
    })
    .where(eq(sozlukEntries.id, entryId))
    .returning({
      upvotes: sozlukEntries.upvotes,
      downvotes: sozlukEntries.downvotes,
    });

  return {
    upvotes: updated?.upvotes ?? 0,
    downvotes: updated?.downvotes ?? 0,
    userVote: nextValue,
  };
}

export async function toggleEntryFavorite(
  tx: DbTx,
  entryId: string,
  authorId: string,
) {
  const [existing] = await tx
    .select()
    .from(sozlukEntryFavorites)
    .where(
      and(
        eq(sozlukEntryFavorites.entryId, entryId),
        eq(sozlukEntryFavorites.authorId, authorId),
      ),
    )
    .limit(1);

  if (existing) {
    await tx
      .delete(sozlukEntryFavorites)
      .where(
        and(
          eq(sozlukEntryFavorites.entryId, entryId),
          eq(sozlukEntryFavorites.authorId, authorId),
        ),
      );
    const [updated] = await tx
      .update(sozlukEntries)
      .set({
        favoritesCount: sql`GREATEST(${sozlukEntries.favoritesCount} - 1, 0)`,
      })
      .where(eq(sozlukEntries.id, entryId))
      .returning({ favoritesCount: sozlukEntries.favoritesCount });
    return { favorited: false, favoritesCount: updated?.favoritesCount ?? 0 };
  }

  await tx.insert(sozlukEntryFavorites).values({ entryId, authorId });
  const [updated] = await tx
    .update(sozlukEntries)
    .set({ favoritesCount: sql`${sozlukEntries.favoritesCount} + 1` })
    .where(eq(sozlukEntries.id, entryId))
    .returning({ favoritesCount: sozlukEntries.favoritesCount });
  return { favorited: true, favoritesCount: updated?.favoritesCount ?? 0 };
}

export async function insertEntryReport(
  tx: DbTx,
  input: {
    entryId: string;
    reporterAuthorId: string;
    reason: SozlukReportReason;
    note: string;
  },
) {
  const [row] = await tx
    .insert(sozlukReports)
    .values({
      entryId: input.entryId,
      reporterAuthorId: input.reporterAuthorId,
      reason: input.reason,
      note: input.note,
    })
    .returning();
  return row!;
}

export async function listAuthorEntriesAndStats(tx: DbTx, authorId: string) {
  const [stats] = await tx
    .select({
      entryCount: sql<number>`count(*)::int`,
      totalUpvotes: sql<number>`coalesce(sum(${sozlukEntries.upvotes}), 0)::int`,
    })
    .from(sozlukEntries)
    .where(
      and(
        eq(sozlukEntries.authorId, authorId),
        eq(sozlukEntries.status, "published"),
      ),
    );

  const entries = await tx
    .select({
      entry: sozlukEntries,
      topic: {
        id: sozlukTopics.id,
        slug: sozlukTopics.slug,
        title: sozlukTopics.title,
      },
    })
    .from(sozlukEntries)
    .innerJoin(sozlukTopics, eq(sozlukEntries.topicId, sozlukTopics.id))
    .where(
      and(
        eq(sozlukEntries.authorId, authorId),
        eq(sozlukEntries.status, "published"),
      ),
    )
    .orderBy(desc(sozlukEntries.createdAt))
    .limit(30);

  return {
    entryCount: stats?.entryCount ?? 0,
    totalUpvotes: stats?.totalUpvotes ?? 0,
    entries,
  };
}
