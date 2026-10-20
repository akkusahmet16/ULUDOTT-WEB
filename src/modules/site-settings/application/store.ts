import "server-only";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { siteSettings } from "../../../db/schema/site-settings.ts";
import { getDatabase } from "../../../lib/database/client.ts";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
export type Setting<T> = { data: T; revision: number };
export async function readSetting<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<Setting<T>> {
  const [row] = await getDatabase()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key));
  return row
    ? { data: schema.parse(row.data), revision: row.revision }
    : { data: structuredClone(fallback), revision: 0 };
}
export async function writeSetting<T>(
  actor: Actor,
  key: string,
  data: T,
  expectedRevision: number,
  validate?: (tx: DbTx) => Promise<void>,
): Promise<Setting<T>> {
  z.int().nonnegative().parse(expectedRevision);
  return withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
    const [current] = await tx
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .for("update");
    if ((current?.revision ?? 0) !== expectedRevision)
      throw Error("Sürüm çakışması");
    await validate?.(tx);
    const revision = expectedRevision + 1;
    if (current)
      await tx
        .update(siteSettings)
        .set({ data, revision })
        .where(eq(siteSettings.key, key));
    else await tx.insert(siteSettings).values({ key, data, revision });
    const hex = createHash("sha256")
      .update(`site-setting:${key}`)
      .digest("hex");
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    await appendAudit(
      tx,
      actor,
      "site_setting.saved",
      { type: "site_setting", id },
      { revision },
    );
    return { data, revision };
  });
}
