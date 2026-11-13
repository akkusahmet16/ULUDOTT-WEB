import "server-only";
import { getSozlukDatabase } from "../../../lib/database/client.ts";
import {
  withSozlukTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import {
  normalizeSozlukNick,
  normalizeSozlukTitle,
  toSozlukSlug,
} from "../domain/slug.ts";
import {
  createEntrySchema,
  createTopicSchema,
  reportEntrySchema,
  updateEntrySchema,
  voteEntrySchema,
  type CreateEntryInput,
  type CreateTopicInput,
  type ReportEntryInput,
} from "../domain/validation.ts";
import {
  createTopic,
  ensureDefaultChannels,
  findAuthorByNick,
  findChannelBySlug,
  findEntryById,
  findTopicByNormalizedTitle,
  findTopicBySlug,
  getRandomTopicSlug,
  getViewerEntryStates,
  insertEntry,
  insertEntryReport,
  listActiveChannels,
  listAuthorEntriesAndStats,
  listLeftFrameTopics,
  listPopularStreamEntries,
  listTopicEntries,
  searchTopicsByQuery,
  softDeleteEntryRecord,
  toggleEntryFavorite,
  updateEntryContent,
  upsertEntryVote,
} from "../infrastructure/sozluk-repository.ts";
import type { SozlukSessionAuthor } from "./sozluk-auth-service.ts";

const PAGE_SIZE = 10;

let cachedChannels: Awaited<ReturnType<typeof listActiveChannels>> | null = null;
let defaultChannelsEnsured = false;

async function getCachedChannels() {
  if (cachedChannels) return cachedChannels;
  const db = getSozlukDatabase();
  if (!defaultChannelsEnsured) {
    await ensureDefaultChannels(db);
    defaultChannelsEnsured = true;
  }
  cachedChannels = await listActiveChannels(db);
  return cachedChannels;
}

const SIDEBAR_CACHE_TTL_MS = 15_000;
interface SidebarCacheEntry {
  data: Awaited<ReturnType<typeof listLeftFrameTopics>>;
  cachedAt: number;
}
const sidebarTopicsCache = new Map<string, SidebarCacheEntry>();

/*
 * Supabase (sözlük DB) VDS'den uzak bir bölgede; her round-trip ~300ms+.
 * Bu yüzden herkese açık okuma verisi süreç içi bellekte önbelleğe alınır ve
 * herhangi bir yazma işleminde (entry/başlık/oy/favori/silme) sürüm artırılarak
 * tamamı geçersiz kılınır. Tek Node süreci çalıştığı için tutarlıdır.
 */
const READ_CACHE_TTL_MS = 60_000;
const READ_CACHE_MAX = 500;
let dataVersion = 0;
const readCache = new Map<string, { version: number; at: number; value: Promise<unknown> }>();

function cachedRead<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = readCache.get(key);
  if (hit && hit.version === dataVersion && now - hit.at < READ_CACHE_TTL_MS) {
    return hit.value as Promise<T>;
  }
  if (readCache.size >= READ_CACHE_MAX) readCache.clear();
  const version = dataVersion;
  const value = loader().catch((error: unknown) => {
    readCache.delete(key);
    throw error;
  });
  readCache.set(key, { version, at: now, value });
  return value;
}

export function invalidateSidebarCache() {
  sidebarTopicsCache.clear();
  dataVersion += 1;
  readCache.clear();
}

/** Yazma işlemi: commit sonrası tüm okuma önbelleğini geçersiz kılar. */
async function withTransaction<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  const result = await withSozlukTransaction(fn);
  invalidateSidebarCache();
  return result;
}

const EMPTY_VIEWER_STATE = () => ({
  votes: new Map<string, 1 | -1>(),
  favorites: new Set<string>(),
});

function loadViewerState(viewerAuthorId: string | undefined, entryIds: string[]) {
  if (!viewerAuthorId || entryIds.length === 0) {
    return Promise.resolve(EMPTY_VIEWER_STATE());
  }
  return cachedRead(`viewer:${viewerAuthorId}:${entryIds.join(",")}`, () =>
    getViewerEntryStates(getSozlukDatabase(), viewerAuthorId, entryIds),
  );
}

async function getCachedSidebarTopics(opts: {
  mode: "gundem" | "bugun" | "kanal";
  channelSlug?: string;
}) {
  const cacheKey = `${opts.mode}:${opts.channelSlug ?? ""}`;
  const now = Date.now();
  const cached = sidebarTopicsCache.get(cacheKey);
  if (cached && now - cached.cachedAt < SIDEBAR_CACHE_TTL_MS) {
    return cached.data;
  }
  const db = getSozlukDatabase();
  const data = await listLeftFrameTopics(db, {
    mode: opts.mode,
    channelSlug: opts.channelSlug,
    limit: 35,
  });
  sidebarTopicsCache.set(cacheKey, { data, cachedAt: now });
  return data;
}

export async function getSozlukSidebarData(opts: {
  mode: "gundem" | "bugun" | "kanal";
  channelSlug?: string;
}) {
  const [channels, topics] = await Promise.all([
    getCachedChannels(),
    getCachedSidebarTopics(opts),
  ]);
  return { channels, topics };
}

export async function getSozlukHomeFeed(viewerAuthorId?: string) {
  const stream = await cachedRead("home-feed", () =>
    listPopularStreamEntries(getSozlukDatabase(), 12),
  );
  const entryIds = stream.map((item) => item.entry.id);
  const viewerState = await loadViewerState(viewerAuthorId, entryIds);

  return stream.map((item) => ({
    ...item,
    viewerVote: (viewerState.votes.get(item.entry.id) ?? 0) as -1 | 0 | 1,
    viewerFavorited: viewerState.favorites.has(item.entry.id),
  }));
}

function findTopicCached(slug: string) {
  return cachedRead(`topic:${slug}`, () =>
    findTopicBySlug(getSozlukDatabase(), slug),
  );
}

export async function getSozlukTopicTitle(slug: string) {
  const found = await findTopicCached(slug);
  return found?.topic ?? null;
}

export async function getSozlukChannelTopics(channelSlug: string) {
  return cachedRead(`channel-topics:${channelSlug}`, () =>
    listLeftFrameTopics(getSozlukDatabase(), {
      mode: "kanal",
      channelSlug,
      limit: 50,
    }),
  );
}

export async function getSozlukTopicPage(
  slug: string,
  opts: {
    filter: "all" | "sukela" | "today";
    page: number;
    viewerAuthorId?: string;
  },
) {
  const found = await findTopicCached(slug);
  if (!found) return null;

  const activeTopic = found.topic;
  const activeChannel = found.channel;

  const page = Math.max(1, opts.page);
  const { total, rows } = await cachedRead(
    `topic-entries:${activeTopic.id}:${opts.filter}:${page}`,
    () =>
      listTopicEntries(getSozlukDatabase(), {
        topicId: activeTopic.id,
        filter: opts.filter,
        page,
        pageSize: PAGE_SIZE,
      }),
  );

  const entryIds = rows.map((r) => r.entry.id);
  const viewerState = await loadViewerState(opts.viewerAuthorId, entryIds);

  return {
    topic: activeTopic,
    channel: activeChannel,
    totalEntries: total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    entries: rows.map((r) => ({
      ...r,
      viewerVote: (viewerState.votes.get(r.entry.id) ?? 0) as -1 | 0 | 1,
      viewerFavorited: viewerState.favorites.has(r.entry.id),
    })),
  };
}

export async function getSozlukAuthorPage(
  nick: string,
  viewerAuthorId?: string,
) {
  const normalized = normalizeSozlukNick(decodeURIComponent(nick));
  const loaded = await cachedRead(`author:${normalized}`, async () => {
    const db = getSozlukDatabase();
    const found = await findAuthorByNick(db, normalized);
    if (!found) return null;
    return { author: found, stats: await listAuthorEntriesAndStats(db, found.id) };
  });
  if (!loaded) return null;
  const { author, stats: statsAndEntries } = loaded;
  const entryIds = statsAndEntries.entries.map((e) => e.entry.id);
  const viewerState = await loadViewerState(viewerAuthorId, entryIds);

  return {
    author: {
      id: author.id,
      nick: author.nick,
      rank: author.rank,
      bio: author.bio,
      createdAt: author.createdAt,
    },
    entryCount: statsAndEntries.entryCount,
    totalUpvotes: statsAndEntries.totalUpvotes,
    entries: statsAndEntries.entries.map((item) => ({
      ...item,
      viewerVote: (viewerState.votes.get(item.entry.id) ?? 0) as -1 | 0 | 1,
      viewerFavorited: viewerState.favorites.has(item.entry.id),
    })),
  };
}

export async function createSozlukTopicWithEntry(
  author: SozlukSessionAuthor,
  raw: CreateTopicInput,
) {
  if (author.status !== "active") throw new Error("SOZLUK_AUTHOR_MUTED");
  const input = createTopicSchema.parse(raw);
  const title = input.title.trim().replace(/\s+/g, " ");
  const normalizedTitle = normalizeSozlukTitle(title);
  const baseSlug = toSozlukSlug(title);
  if (!baseSlug) throw new Error("SOZLUK_INVALID_TITLE");

  return withTransaction(async (tx) => {
    await ensureDefaultChannels(tx);
    let topic = await findTopicByNormalizedTitle(tx, normalizedTitle);
    if (!topic) {
      let candidateSlug = baseSlug;
      const slugTaken = await findTopicBySlug(tx, candidateSlug);
      if (slugTaken) {
        candidateSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
      }
      const channel = input.channelSlug
        ? await findChannelBySlug(tx, input.channelSlug)
        : await findChannelBySlug(tx, "gundem");

      topic = await createTopic(tx, {
        slug: candidateSlug,
        title,
        normalizedTitle,
        channelId: channel?.id ?? null,
        createdByAuthorId: author.id,
      });
    } else if (topic.isLocked) {
      throw new Error("SOZLUK_TOPIC_LOCKED");
    }

    const entry = await insertEntry(tx, {
      topicId: topic.id,
      authorId: author.id,
      content: input.content.trim(),
      status: author.rank === "caylak" ? "pending" : "published",
    });

    return { topic, entry };
  });
}

export async function createSozlukEntry(
  author: SozlukSessionAuthor,
  raw: CreateEntryInput,
) {
  if (author.status !== "active") throw new Error("SOZLUK_AUTHOR_MUTED");
  const input = createEntrySchema.parse(raw);

  return withTransaction(async (tx) => {
    const found = await findTopicBySlug(tx, input.topicSlug);
    if (!found) throw new Error("SOZLUK_TOPIC_NOT_FOUND");
    if (found.topic.isLocked) throw new Error("SOZLUK_TOPIC_LOCKED");

    const entry = await insertEntry(tx, {
      topicId: found.topic.id,
      authorId: author.id,
      content: input.content.trim(),
      status: author.rank === "caylak" ? "pending" : "published",
    });

    return { topic: found.topic, entry };
  });
}

export async function updateSozlukEntry(
  author: SozlukSessionAuthor,
  entryId: string,
  rawContent: string,
) {
  const input = updateEntrySchema.parse({ content: rawContent });
  return withTransaction(async (tx) => {
    const existing = await findEntryById(tx, entryId);
    if (!existing || existing.status === "deleted") {
      throw new Error("SOZLUK_ENTRY_NOT_FOUND");
    }
    const isMod = author.rank === "moderator" || author.rank === "admin";
    if (existing.authorId !== author.id && !isMod) {
      throw new Error("SOZLUK_FORBIDDEN");
    }
    return updateEntryContent(tx, entryId, input.content.trim());
  });
}

export async function deleteSozlukEntry(
  author: SozlukSessionAuthor,
  entryId: string,
) {
  return withTransaction(async (tx) => {
    const existing = await findEntryById(tx, entryId);
    if (!existing || existing.status === "deleted") {
      throw new Error("SOZLUK_ENTRY_NOT_FOUND");
    }
    const isMod = author.rank === "moderator" || author.rank === "admin";
    if (existing.authorId !== author.id && !isMod) {
      throw new Error("SOZLUK_FORBIDDEN");
    }
    return softDeleteEntryRecord(tx, entryId, existing);
  });
}

export async function voteSozlukEntry(
  author: SozlukSessionAuthor,
  entryId: string,
  rawValue: number,
) {
  const { value } = voteEntrySchema.parse({ value: rawValue });
  return withTransaction(async (tx) => {
    const existing = await findEntryById(tx, entryId);
    if (!existing || existing.status !== "published") {
      throw new Error("SOZLUK_ENTRY_NOT_FOUND");
    }
    return upsertEntryVote(tx, entryId, author.id, value);
  });
}

export async function favoriteSozlukEntry(
  author: SozlukSessionAuthor,
  entryId: string,
) {
  return withTransaction(async (tx) => {
    const existing = await findEntryById(tx, entryId);
    if (!existing || existing.status !== "published") {
      throw new Error("SOZLUK_ENTRY_NOT_FOUND");
    }
    return toggleEntryFavorite(tx, entryId, author.id);
  });
}

export async function reportSozlukEntry(
  author: SozlukSessionAuthor,
  entryId: string,
  raw: ReportEntryInput,
) {
  const input = reportEntrySchema.parse(raw);
  return withTransaction(async (tx) => {
    const existing = await findEntryById(tx, entryId);
    if (!existing || existing.status === "deleted") {
      throw new Error("SOZLUK_ENTRY_NOT_FOUND");
    }
    return insertEntryReport(tx, {
      entryId,
      reporterAuthorId: author.id,
      reason: input.reason,
      note: input.note ?? "",
    });
  });
}

export async function searchSozlukTopics(query: string) {
  const normalized = query.trim().toLocaleLowerCase("tr");
  return cachedRead(`search:${normalized}`, () =>
    searchTopicsByQuery(getSozlukDatabase(), query, 15),
  );
}

export async function getSozlukRandomSlug() {
  return getRandomTopicSlug(getSozlukDatabase());
}
