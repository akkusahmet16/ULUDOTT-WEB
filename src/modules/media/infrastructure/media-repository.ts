import "server-only";
import { eq } from "drizzle-orm";
import type { DbTx } from "../../../lib/database/transaction.ts";
import {
  mediaAssets,
  mediaVariants,
  announcements,
  games,
  featuredSlots,
} from "../../../db/schema/content.ts";
export async function asset(tx: DbTx, id: string, lock = false) {
  const q = tx.select().from(mediaAssets).where(eq(mediaAssets.id, id));
  return (lock ? await q.for("update") : await q)[0];
}
export async function variants(tx: DbTx, id: string) {
  return tx.select().from(mediaVariants).where(eq(mediaVariants.assetId, id));
}
export async function references(tx: DbTx, id: string) {
  const a = await tx
      .select({ id: announcements.id })
      .from(announcements)
      .where(eq(announcements.mediaId, id)),
    g = await tx
      .select({ id: games.id })
      .from(games)
      .where(eq(games.mediaId, id)),
    f = await tx
      .select({ id: featuredSlots.id })
      .from(featuredSlots)
      .where(eq(featuredSlots.mediaId, id));
  return [
    ...a.map((x) => ({ ...x, type: "announcement" })),
    ...g.map((x) => ({ ...x, type: "game" })),
    ...f.map((x) => ({ ...x, type: "featured_slot" })),
  ];
}
