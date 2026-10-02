import "server-only";
import { eq, asc } from "drizzle-orm";
import { links, linkGroups } from "../../../db/schema/links.ts";
import type { DbTx } from "../../../lib/database/transaction.ts";
export const linkRecord = async (tx: DbTx, id: string) =>
  (await tx.select().from(links).where(eq(links.id, id)).for("update"))[0];
export const groupRecord = async (tx: DbTx, id: string) =>
  (
    await tx
      .select()
      .from(linkGroups)
      .where(eq(linkGroups.id, id))
      .for("update")
  )[0];
export async function inventory(tx: DbTx) {
  return {
    groups: await tx
      .select()
      .from(linkGroups)
      .orderBy(asc(linkGroups.position), asc(linkGroups.id)),
    links: await tx
      .select()
      .from(links)
      .orderBy(asc(links.position), asc(links.id)),
  };
}
