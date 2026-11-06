import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { siteGameEntries } from "../../../db/schema/site-games.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import { assertSiteAsset } from "../../media/application/site-assets.ts";
import {
  defaultSiteGames,
  siteGameInput,
  type SiteGame,
} from "../domain/site-games.ts";

async function inventory(): Promise<SiteGame[]> {
  const all = new Map(defaultSiteGames.map((game) => [game.id, game]));
  for (const row of await getDatabase().select().from(siteGameEntries)) {
    if (row.deleted) {
      all.delete(row.id);
      continue;
    }
    const fields = siteGameInput.safeParse(row.data);
    if (fields.success)
      all.set(row.id, { ...fields.data, id: row.id, revision: row.revision });
    else all.delete(row.id);
  }
  return [...all.values()].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
}
export async function listSiteGames(actor: Actor) {
  requirePermission(actor, "publication.write");
  return inventory();
}
export async function listPublishedSiteGames() {
  return (await inventory()).filter((game) => game.published);
}
export async function saveSiteGame(
  actor: Actor,
  input: unknown,
  id?: string,
  expectedRevision?: number,
): Promise<SiteGame> {
  requirePermission(actor, "publication.write");
  const fields = siteGameInput.parse(input);
  if (id) {
    z.uuid().parse(id);
    z.int().nonnegative().parse(expectedRevision);
  }
  if (fields.published || fields.image) {
    await assertSiteAsset(fields.image, "games", "image");
  }
  const gameId = id ?? randomUUID();
  return withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${gameId}))`);
    const [current] = await tx
      .select()
      .from(siteGameEntries)
      .where(eq(siteGameEntries.id, gameId))
      .for("update");
    if (id && !current && !defaultSiteGames.some((game) => game.id === id))
      throw Error("Oyun bulunamadı");
    if (current?.deleted) throw Error("Oyun bulunamadı");
    if (id && (current?.revision ?? 0) !== expectedRevision)
      throw Error("Sürüm çakışması");
    const revision = (current?.revision ?? 0) + 1;
    if (current)
      await tx
        .update(siteGameEntries)
        .set({ data: fields, revision })
        .where(eq(siteGameEntries.id, gameId));
    else
      await tx
        .insert(siteGameEntries)
        .values({ id: gameId, data: fields, revision });
    await appendAudit(
      tx,
      actor,
      "site_game.saved",
      { type: "site_game", id: gameId },
      {
        revision,
        status: fields.published ? "published" : "draft",
        changedFields: ["title", "media"],
      },
    );
    return { ...fields, id: gameId, revision };
  });
}
export async function removeSiteGame(
  actor: Actor,
  id: string,
  expectedRevision: number,
) {
  requirePermission(actor, "publication.write");
  z.uuid().parse(id);
  z.int().nonnegative().parse(expectedRevision);
  return withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
    const [current] = await tx
      .select()
      .from(siteGameEntries)
      .where(eq(siteGameEntries.id, id))
      .for("update");
    const fallback = defaultSiteGames.find((game) => game.id === id);
    if ((!current && !fallback) || current?.deleted)
      throw Error("Oyun bulunamadı");
    if ((current?.revision ?? 0) !== expectedRevision)
      throw Error("Sürüm çakışması");
    const revision = expectedRevision + 1;
    if (current)
      await tx
        .update(siteGameEntries)
        .set({ deleted: true, revision })
        .where(eq(siteGameEntries.id, id));
    else
      await tx
        .insert(siteGameEntries)
        .values({ id, data: fallback!, deleted: true, revision });
    await appendAudit(
      tx,
      actor,
      "site_game.removed",
      { type: "site_game", id },
      { revision, status: "archived" },
    );
    return { id, revision };
  });
}
