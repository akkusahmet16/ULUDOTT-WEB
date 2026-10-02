import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, and, sql, inArray } from "drizzle-orm";
import { getDatabase } from "../../../lib/database/client.ts";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import {
  events,
  games,
  gameCredits,
  awards,
  finalists,
  mediaAssets,
  mediaVariants,
} from "../../../db/schema/content.ts";
import { teams, memberships, applications } from "../../../db/schema/ulujam.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { SubmissionError } from "../../forms/domain/submission-error.ts";
import { randomToken, tokenHash } from "../../../lib/auth/crypto.ts";
import {
  encryptReplay,
  decryptReplay,
} from "../../forms/infrastructure/submission-repository.ts";
import { refreshApplicationCards } from "../../cards/application/card-revision.ts";
import { readCard } from "../../cards/infrastructure/card-repository.ts";
import {
  gameDraft,
  itchUrl,
  assertFullGame,
  isHistoricalGame,
} from "../domain/game-publication.ts";
import { historical2026 } from "../domain/historical-result.ts";
function requireGameEdit(actor: Actor, eventId: string) {
  requirePermission(actor, "games.edit");
  if (!actor.roles.includes("content_editor"))
    requirePermission(actor, "games.publish", eventId);
}
export async function lockGameEvent(
  tx: DbTx,
  actor: Actor,
  eventId: string,
  permission = "games.edit",
) {
  if (permission === "games.edit") requireGameEdit(actor, eventId);
  else requirePermission(actor, permission, eventId);
  const [e] = await tx
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .for("update");
  if (!e || e.kind !== "ulujam" || ["cancelled", "archived"].includes(e.status))
    throw new SubmissionError(409, "Etkinlik oyun yönetimine kapalı");
  return e;
}
export async function lockGame(
  tx: DbTx,
  actor: Actor,
  id: string,
  permission = "games.edit",
) {
  z.uuid().parse(id);
  const [initial] = await tx
    .select({ eventId: games.eventId })
    .from(games)
    .where(eq(games.id, id));
  if (!initial) throw new SubmissionError(404, "Oyun bulunamadı");
  const event = await lockGameEvent(tx, actor, initial.eventId, permission);
  const [game] = await tx
    .select()
    .from(games)
    .where(eq(games.id, id))
    .for("update");
  return { game, event };
}
export async function gameCardsChanged(tx: DbTx, teamIds: (string | null)[]) {
  const ids = Array.from(new Set(teamIds.filter((id): id is string => !!id)));
  if (!ids.length) return;
  const members = await tx
    .select({ id: memberships.applicationId })
    .from(memberships)
    .where(
      and(inArray(memberships.teamId, ids), sql`${memberships.leftAt} is null`),
    );
  await refreshApplicationCards(
    tx,
    members.map((m) => m.id),
  );
}
async function coverReady(tx: DbTx, id: string | null) {
  if (!id) return;
  const [media] = await tx
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .for("share");
  const [variant] = await tx
    .select({ id: mediaVariants.id })
    .from(mediaVariants)
    .where(
      and(
        eq(mediaVariants.assetId, id),
        eq(mediaVariants.purpose, "webp"),
        sql`${mediaVariants.publishedAt} is not null`,
      ),
    );
  if (!media || media.status !== "ready" || !media.altText || !variant)
    throw new SubmissionError(
      409,
      "Yayımlanmış kapak ve alternatif metin gerekli",
    );
}
async function teamForGame(tx: DbTx, eventId: string, teamId: string | null) {
  if (!teamId) return;
  const [t] = await tx
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
    .for("update");
  if (!t) throw new SubmissionError(400, "Takım etkinlikle uyuşmuyor");
  return t;
}
export async function saveGameDraft(
  actor: Actor,
  eventId: string,
  raw: unknown,
) {
  z.uuid().parse(eventId);
  const d = gameDraft.parse(raw);
  return withTransaction(async (tx) => {
    await lockGameEvent(tx, actor, eventId);
    let old: typeof games.$inferSelect | undefined;
    if (d.id) {
      [old] = await tx
        .select()
        .from(games)
        .where(and(eq(games.id, d.id), eq(games.eventId, eventId)))
        .for("update");
      if (!old) throw new SubmissionError(404, "Oyun bulunamadı");
      if (old.revision !== d.expectedRevision) throw Error("Sürüm çakışması");
      if (old.slugLocked && old.slug !== d.slug)
        throw new SubmissionError(
          409,
          "İlk yayından sonra oyun adresi sabittir",
        );
    }
    const id = old?.id ?? randomUUID(),
      historic = isHistoricalGame(eventId, id),
      partial = d.historicalPartial ?? old?.historicalPartial ?? false;
    if (partial && !historic)
      throw new SubmissionError(
        400,
        "Kısmi kayıt yalnız 2026 arşivinde kullanılabilir",
      );
    if (d.editorialTeamName && !historic)
      throw new SubmissionError(
        400,
        "Editoryal takım yalnız 2026 arşivinde kullanılabilir",
      );
    if (
      historic &&
      historical2026.results.find((r) => r.id === id)!.itchUrl !== d.itchUrl
    )
      throw new SubmissionError(
        409,
        "Doğrulanmış 2026 bağlantısı korunmalıdır",
      );
    await teamForGame(tx, eventId, d.teamId);
    await coverReady(tx, d.mediaId);
    const oldCredits = old
      ? await tx
          .select()
          .from(gameCredits)
          .where(eq(gameCredits.gameId, id))
          .for("update")
      : [];
    const inputIds = d.credits
      .filter((c) => c.applicationId)
      .map((c) => c.applicationId!);
    if (new Set(inputIds).size !== inputIds.length)
      throw new SubmissionError(400, "Aynı yapımcı iki kez seçilemez");
    for (const c of d.credits) {
      if (!c.applicationId) {
        if (!historic)
          throw new SubmissionError(400, "Yapımcı takım üyesi olmalıdır");
      } else {
        const [m] = await tx
          .select({ id: applications.id })
          .from(applications)
          .innerJoin(
            memberships,
            eq(memberships.applicationId, applications.id),
          )
          .where(
            and(
              eq(applications.id, c.applicationId),
              eq(applications.eventId, eventId),
              eq(
                memberships.teamId,
                d.teamId ?? "00000000-0000-4000-8000-000000000000",
              ),
              sql`${memberships.leftAt} is null`,
              sql`(${applications.submissionId} is null or exists(select 1 from submissions s where s.id=${applications.submissionId} and s.expires_at>clock_timestamp()))`,
            ),
          );
        if (!m) throw new SubmissionError(400, "Yapımcı takım üyesi olmalıdır");
      }
    }
    const revision = (old?.revision ?? 0) + 1,
      values = {
        eventId,
        teamId: d.teamId,
        editorialTeamName: historic ? (d.editorialTeamName ?? null) : null,
        title: d.title,
        slug: d.slug,
        description: d.description,
        mediaId: d.mediaId,
        itchUrl: d.itchUrl,
        historicalPartial: partial,
        publishedAt: null,
        revision,
      };
    if (old) await tx.update(games).set(values).where(eq(games.id, id));
    else await tx.insert(games).values({ id, ...values });
    const kept: string[] = [];
    for (const c of d.credits) {
      const prior = c.id
        ? oldCredits.find((p) => p.id === c.id)
        : oldCredits.find(
            (p) =>
              p.applicationId !== null && p.applicationId === c.applicationId,
          );
      if (c.id && !prior)
        throw new SubmissionError(400, "Yapımcı kaydı oyunla uyuşmuyor");
      const same =
        prior &&
        prior.applicationId === c.applicationId &&
        prior.publicationName === c.publicationName;
      if (prior) {
        kept.push(prior.id);
        const replaceInvite =
          prior.applicationId !== c.applicationId ||
          (c.applicationId === null &&
            prior.publicationName !== c.publicationName) ||
          !prior.consentTokenEncrypted;
        const replacement = replaceInvite ? randomToken() : null;
        await tx
          .update(gameCredits)
          .set({
            applicationId: c.applicationId,
            publicationName: c.publicationName,
            consentedAt: same ? prior.consentedAt : null,
            revision: prior.revision + 1,
            ...(replacement
              ? {
                  consentTokenHash: tokenHash(replacement),
                  consentTokenEncrypted: encryptReplay(
                    { token: replacement },
                    "credit:" + prior.id,
                  ),
                }
              : {}),
          })
          .where(eq(gameCredits.id, prior.id));
      } else {
        const creditId = randomUUID(),
          token = randomToken();
        kept.push(creditId);
        await tx.insert(gameCredits).values({
          id: creditId,
          gameId: id,
          applicationId: c.applicationId,
          publicationName: c.publicationName,
          consentTokenHash: tokenHash(token),
          consentTokenEncrypted: encryptReplay({ token }, "credit:" + creditId),
        });
      }
    }
    for (const c of oldCredits)
      if (!kept.includes(c.id))
        await tx.delete(gameCredits).where(eq(gameCredits.id, c.id));
    await gameCardsChanged(tx, [old?.teamId ?? null, d.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.draft_saved",
      { type: "game", id },
      {
        revision,
        status: "draft",
        changedFields: [
          "title",
          "slug",
          "description",
          "media",
          "publicationName",
        ],
      },
    );
    return { id, revision };
  });
}
function checkRevision(actual: number, expected?: number) {
  if (expected !== undefined && actual !== expected)
    throw Error("Sürüm çakışması");
}
export async function publishGame(
  actor: Actor,
  id: string,
  expectedRevision?: number,
) {
  return withTransaction(async (tx) => {
    const { game: g, event } = await lockGame(tx, actor, id, "games.publish");
    checkRevision(g.revision, expectedRevision);
    itchUrl.parse(g.itchUrl);
    const credits = await tx
      .select()
      .from(gameCredits)
      .where(eq(gameCredits.gameId, id))
      .for("share");
    assertFullGame(g, credits);
    await coverReady(tx, g.mediaId);
    if (!g.historicalPartial) {
      if (
        !isHistoricalGame(g.eventId, g.id) &&
        !["published", "ended"].includes(event.status)
      )
        throw new SubmissionError(409, "Etkinlik yayımlanmış olmalıdır");
      const team = await teamForGame(tx, g.eventId, g.teamId);
      if (
        g.teamId &&
        (!team || !["approved", "changes_requested"].includes(team.status))
      )
        throw new SubmissionError(409, "Takım onayı gerekli");
      for (const c of credits) {
        if (c.applicationId) {
          const r = await readCard(
            sql`c.application_id=${c.applicationId}::uuid`,
            tx,
          );
          if (
            !r ||
            r.expired ||
            r.status !== "active" ||
            r.teamName !== team?.name
          )
            throw new SubmissionError(409, "Yapımcı katılım onayı gerekli");
          const [member] = await tx
            .select({ id: memberships.id })
            .from(memberships)
            .where(
              and(
                eq(memberships.applicationId, c.applicationId),
                eq(memberships.teamId, g.teamId!),
                sql`${memberships.leftAt} is null`,
              ),
            );
          if (!member) throw new SubmissionError(409, "Yapımcı takımda değil");
        } else if (!isHistoricalGame(g.eventId, g.id))
          throw new SubmissionError(409, "Yapımcı katılım onayı gerekli");
      }
    }
    const revision = g.revision + 1;
    await tx
      .update(games)
      .set({
        publishedAt: sql`now()`,
        revision,
        slugLocked: !!g.slug || g.slugLocked,
      })
      .where(eq(games.id, id));
    await gameCardsChanged(tx, [g.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.published",
      { type: "game", id },
      { revision, status: "published", recordCount: credits.length },
    );
    return { id, revision };
  });
}
export async function unpublishGame(
  actor: Actor,
  id: string,
  expectedRevision?: number,
) {
  return withTransaction(async (tx) => {
    const { game: g } = await lockGame(tx, actor, id, "games.publish");
    checkRevision(g.revision, expectedRevision);
    const revision = g.revision + 1;
    await tx
      .update(games)
      .set({ publishedAt: null, revision })
      .where(eq(games.id, id));
    await gameCardsChanged(tx, [g.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.unpublished",
      { type: "game", id },
      { revision, status: "draft" },
    );
    return { id, revision };
  });
}
export async function markFinalist(
  actor: Actor,
  id: string,
  expectedRevision?: number,
  selected = true,
) {
  return withTransaction(async (tx) => {
    const { game: g } = await lockGame(tx, actor, id, "games.publish");
    checkRevision(g.revision, expectedRevision);
    const [prior] = await tx
      .select()
      .from(finalists)
      .where(eq(finalists.gameId, id));
    if (selected && !prior) {
      const [{ n }] = await tx
        .select({ n: sql<number>`coalesce(max(${finalists.position}),-1)+1` })
        .from(finalists)
        .where(eq(finalists.eventId, g.eventId));
      await tx
        .insert(finalists)
        .values({ eventId: g.eventId, gameId: id, position: n });
    }
    if (!selected && prior)
      await tx.delete(finalists).where(eq(finalists.gameId, id));
    const revision = g.revision + 1;
    await tx.update(games).set({ revision }).where(eq(games.id, id));
    await gameCardsChanged(tx, [g.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.finalist_changed",
      { type: "game", id },
      { revision, changedFields: ["status"] },
    );
    return { id, revision };
  });
}
export async function assignAward(
  actor: Actor,
  eventId: string,
  rank: number | null,
  id: string,
  expectedRevision?: number,
) {
  if (rank !== null) z.int().min(1).max(3).parse(rank);
  return withTransaction(async (tx) => {
    const { game: g } = await lockGame(tx, actor, id, "games.publish");
    if (g.eventId !== eventId)
      throw new SubmissionError(400, "Oyun etkinlikle uyuşmuyor");
    checkRevision(g.revision, expectedRevision);
    if (rank !== null) {
      const [occupied] = await tx
        .select()
        .from(awards)
        .where(and(eq(awards.eventId, eventId), eq(awards.rank, rank)));
      if (occupied && occupied.gameId !== id)
        throw new SubmissionError(409, "Bu derece başka oyunda kullanılıyor");
    }
    await tx.delete(awards).where(eq(awards.gameId, id));
    if (rank !== null)
      await tx.insert(awards).values({ eventId, gameId: id, rank });
    const revision = g.revision + 1;
    await tx.update(games).set({ revision }).where(eq(games.id, id));
    await gameCardsChanged(tx, [g.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.award_changed",
      { type: "game", id },
      { revision, changedFields: ["rank"] },
    );
    return { id, revision };
  });
}
export async function getGameEditor(actor: Actor, id: string) {
  requirePermission(actor, "games.edit");
  z.uuid().parse(id);
  const db = getDatabase();
  const [g] = await db.select().from(games).where(eq(games.id, id));
  if (!g) throw new SubmissionError(404, "Oyun bulunamadı");
  requireGameEdit(actor, g.eventId);
  const credits = await db
    .select()
    .from(gameCredits)
    .where(eq(gameCredits.gameId, id))
    .orderBy(gameCredits.id);
  const [award] = await db.select().from(awards).where(eq(awards.gameId, id));
  const [finalist] = await db
    .select()
    .from(finalists)
    .where(eq(finalists.gameId, id));
  return {
    ...g,
    published: !!g.publishedAt,
    historic: isHistoricalGame(g.eventId, id),
    rank: award?.rank ?? null,
    finalist: !!finalist,
    credits: credits.map((c) => ({
      id: c.id,
      applicationId: c.applicationId,
      publicationName: c.publicationName,
      revision: c.revision,
      consented: !!c.consentedAt,
      token: c.consentTokenEncrypted
        ? z
            .object({ token: z.string() })
            .parse(decryptReplay(c.consentTokenEncrypted, "credit:" + c.id))
            .token
        : null,
    })),
  };
}
export type GameEditorData = Awaited<ReturnType<typeof getGameEditor>>;
export async function gameOptions(
  actor: Actor,
  eventId: string,
  raw: {
    teamId?: string;
    mediaId?: string;
    teamCursor?: string;
    mediaCursor?: string;
  } = {},
) {
  requirePermission(actor, "games.edit");
  z.uuid().parse(eventId);
  requireGameEdit(actor, eventId);
  const options = z
    .strictObject({
      teamId: z.uuid().optional(),
      mediaId: z.uuid().optional(),
      teamCursor: z.uuid().optional(),
      mediaCursor: z.uuid().optional(),
    })
    .parse(raw);
  const mayReadNames =
      actor.roles.includes("event_manager") &&
      actor.eventScopes.includes(eventId),
    db = getDatabase();
  const page = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(
      and(
        eq(teams.eventId, eventId),
        options.teamCursor
          ? sql`${teams.id}>${options.teamCursor}::uuid`
          : undefined,
      ),
    )
    .orderBy(teams.id)
    .limit(51);
  const teamRows = page.slice(0, 50);
  if (options.teamId && !teamRows.some((t) => t.id === options.teamId)) {
    const [selected] = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.eventId, eventId), eq(teams.id, options.teamId)));
    if (selected) teamRows.push(selected);
  }
  const members = options.teamId
    ? await db
        .select({
          id: applications.id,
          teamId: memberships.teamId,
          label: mayReadNames
            ? applications.fullName
            : sql<string>`${applications.id}::text`,
        })
        .from(applications)
        .innerJoin(memberships, eq(memberships.applicationId, applications.id))
        .where(
          and(
            eq(applications.eventId, eventId),
            eq(memberships.teamId, options.teamId),
            sql`${memberships.leftAt} is null`,
            sql`(${applications.submissionId} is null or exists(select 1 from submissions s where s.id=${applications.submissionId} and s.expires_at>clock_timestamp()))`,
          ),
        )
        .orderBy(applications.id)
    : [];
  async function coverPage(filter: ReturnType<typeof sql> | undefined) {
    return db
      .select({ id: mediaAssets.id, label: mediaAssets.altText })
      .from(mediaAssets)
      .innerJoin(mediaVariants, eq(mediaVariants.assetId, mediaAssets.id))
      .where(
        and(
          eq(mediaAssets.status, "ready"),
          eq(mediaVariants.purpose, "webp"),
          sql`${mediaVariants.publishedAt} is not null`,
          filter,
        ),
      )
      .orderBy(mediaAssets.id)
      .limit(51);
  }
  const mediaPage = await coverPage(
      options.mediaCursor
        ? sql`${mediaAssets.id}>${options.mediaCursor}::uuid`
        : undefined,
    ),
    covers = mediaPage.slice(0, 50);
  if (options.mediaId && !covers.some((c) => c.id === options.mediaId)) {
    const [selected] = await coverPage(eq(mediaAssets.id, options.mediaId));
    if (selected) covers.push(selected);
  }
  return {
    teams: teamRows,
    members,
    covers,
    nextTeamCursor: page.length > 50 ? page[49].id : null,
    nextMediaCursor: mediaPage.length > 50 ? mediaPage[49].id : null,
  };
}
export async function listGames(
  actor: Actor,
  eventId?: string,
  cursor?: string,
) {
  requirePermission(actor, "games.edit");
  if (eventId) {
    z.uuid().parse(eventId);
    requireGameEdit(actor, eventId);
  }
  if (cursor) z.uuid().parse(cursor);
  const db = getDatabase();
  const eventRows = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(
      and(
        eq(events.kind, "ulujam"),
        actor.roles.includes("content_editor")
          ? undefined
          : actor.eventScopes.length
            ? inArray(events.id, actor.eventScopes)
            : sql`false`,
      ),
    )
    .orderBy(events.title)
    .limit(100);
  const rows = await db
    .select({
      id: games.id,
      eventId: games.eventId,
      title: games.title,
      itchUrl: games.itchUrl,
      revision: games.revision,
      publishedAt: games.publishedAt,
      historicalPartial: games.historicalPartial,
    })
    .from(games)
    .where(
      and(
        actor.roles.includes("content_editor")
          ? undefined
          : actor.eventScopes.length
            ? inArray(games.eventId, actor.eventScopes)
            : sql`false`,
        eventId ? eq(games.eventId, eventId) : undefined,
        cursor ? sql`${games.id}>${cursor}::uuid` : undefined,
      ),
    )
    .orderBy(games.id)
    .limit(51);
  return {
    events: eventRows,
    items: rows.slice(0, 50),
    nextCursor: rows.length > 50 ? rows[49].id : null,
  };
}
export async function attachGameCover(
  actor: Actor,
  id: string,
  mediaId: string,
) {
  return withTransaction(async (tx) => {
    const { game: g } = await lockGame(tx, actor, id);
    requirePermission(actor, "media.attach", g.eventId);
    await coverReady(tx, mediaId);
    const revision = g.revision + 1;
    await tx
      .update(games)
      .set({ mediaId, revision, publishedAt: null })
      .where(eq(games.id, id));
    await gameCardsChanged(tx, [g.teamId]);
    await appendAudit(
      tx,
      actor,
      "game.cover_changed",
      { type: "game", id },
      { revision, status: "draft", changedFields: ["media"] },
    );
  });
}
