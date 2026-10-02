import "server-only";
import { attachGameCover } from "../../games/application/game-service.ts";
import { randomUUID } from "node:crypto";
import { eq, and, isNotNull, desc, sql } from "drizzle-orm";
import { z } from "zod";
import type { Actor } from "../../../lib/logging/audit.ts";
import { appendAudit } from "../../../lib/logging/audit.ts";
import { enqueue } from "../../../lib/queue/outbox.ts";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  mediaAssets,
  mediaVariants,
  announcements,
  featuredSlots,
} from "../../../db/schema/content.ts";
import {
  MAX_BYTES,
  validateMedia,
  type MediaPurpose,
} from "../domain/media-policy.ts";
import { processImage } from "../infrastructure/process-image.ts";
import {
  putPrivate,
  readPrivate,
  removePrivate,
} from "../infrastructure/object-store.ts";
import {
  asset,
  variants,
  references,
} from "../infrastructure/media-repository.ts";
export type MediaAsset = typeof mediaAssets.$inferSelect;
const uuid = (id: string) => z.uuid().parse(id);
export async function uploadMedia(
  actor: Actor,
  file: File,
  purpose: MediaPurpose,
  altText: string,
): Promise<MediaAsset> {
  requirePermission(actor, "media.write");
  const alt = z.string().trim().min(1).max(250).parse(altText);
  z.enum(["photo", "poster", "game", "social"]).parse(purpose);
  if (!file.size || file.size > MAX_BYTES)
    throw new Error("Dosya boyutu sınırı");
  const written: string[] = [];
  try {
    return await withTransaction(async (tx) => {
      const lock = await tx.execute(
        sql`select pg_try_advisory_xact_lock(52891475) as acquired`,
      );
      if (!lock[0]?.acquired) throw new Error("Medya işleme meşgul");
      const bytes = Buffer.from(await file.arrayBuffer()),
        kind = validateMedia(bytes, file.type);
      const outputs = await processImage(bytes, kind === "heic");
      const id = randomUUID(),
        originalKey = `originals/${randomUUID()}`;
      // PUT zaman aşımı sonrası nesne oluşmuş olabilir; cleanup'a PUT'tan önce ekle.
      written.push(originalKey);
      await putPrivate(originalKey, bytes, file.type);
      const [row] = await tx
        .insert(mediaAssets)
        .values({
          id,
          originalKey,
          mimeType: file.type,
          byteSize: bytes.length,
          altText: alt,
          status: "ready",
        })
        .returning();
      for (const v of outputs) {
        const key = `variants/${randomUUID()}.${v.format}`;
        written.push(key);
        await putPrivate(key, v.data, v.mimeType);
        await tx.insert(mediaVariants).values({
          assetId: id,
          objectKey: key,
          purpose: `${purpose}-${v.format}`,
          width: v.width,
          height: v.height,
          mimeType: v.mimeType,
        });
      }
      await appendAudit(
        tx,
        actor,
        "media.uploaded",
        { type: "media", id },
        { changedFields: ["media"] },
      );
      return row;
    });
  } catch (error) {
    await Promise.allSettled(written.map(removePrivate));
    throw error;
  }
}
export async function listMedia(actor: Actor) {
  requirePermission(actor, "media.write");
  return withTransaction(async (tx) => {
    const rows = await tx
      .select({
        id: mediaAssets.id,
        altText: mediaAssets.altText,
        status: mediaAssets.status,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.status, "ready"))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(100);
    return Promise.all(
      rows.map(async (a) => ({
        ...a,
        variants: (await variants(tx, a.id)).map((v) => ({
          id: v.id,
          mimeType: v.mimeType,
          width: v.width,
          height: v.height,
          published: !!v.publishedAt,
        })),
      })),
    );
  });
}
export async function publishVariant(
  assetId: string,
  actor: Actor,
): Promise<string> {
  requirePermission(actor, "media.write");
  return withTransaction(async (tx) => {
    const a = await asset(tx, uuid(assetId), true);
    if (!a || a.status !== "ready" || !a.altText?.trim())
      throw new Error("Medya yayına uygun değil");
    const all = await variants(tx, a.id);
    if (
      all.length !== 3 ||
      all.some(
        (v) => !["image/webp", "image/avif", "image/jpeg"].includes(v.mimeType),
      )
    )
      throw new Error("Medya yayına uygun değil");
    await tx
      .update(mediaVariants)
      .set({ publishedAt: new Date() })
      .where(eq(mediaVariants.assetId, a.id));
    await appendAudit(
      tx,
      actor,
      "media.published",
      { type: "media", id: a.id },
      { changedFields: ["media"] },
    );
    return `/media/${all.find((v) => v.mimeType === "image/webp")!.id}`;
  });
}
export async function getPublicVariant(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const row = await withTransaction(
    async (tx) =>
      (
        await tx
          .select({
            key: mediaVariants.objectKey,
            mimeType: mediaVariants.mimeType,
            altText: mediaAssets.altText,
          })
          .from(mediaVariants)
          .innerJoin(mediaAssets, eq(mediaAssets.id, mediaVariants.assetId))
          .where(
            and(
              eq(mediaVariants.id, id),
              isNotNull(mediaVariants.publishedAt),
              eq(mediaAssets.status, "ready"),
            ),
          )
      )[0],
  );
  return row
    ? {
        data: await readPrivate(row.key),
        mimeType: row.mimeType,
        altText: row.altText,
      }
    : null;
}
export async function getPrivatePreview(actor: Actor, id: string) {
  requirePermission(actor, "media.write");
  const row = await withTransaction(
    async (tx) =>
      (
        await tx
          .select({
            key: mediaVariants.objectKey,
            mimeType: mediaVariants.mimeType,
          })
          .from(mediaVariants)
          .innerJoin(mediaAssets, eq(mediaAssets.id, mediaVariants.assetId))
          .where(
            and(
              eq(mediaVariants.id, uuid(id)),
              eq(mediaAssets.status, "ready"),
            ),
          )
      )[0],
  );
  return row
    ? { data: await readPrivate(row.key), mimeType: row.mimeType }
    : null;
}
export async function previewDeletion(actor: Actor, id: string) {
  requirePermission(actor, "media.write");
  return withTransaction(async (tx) => {
    if (!(await asset(tx, uuid(id)))) throw new Error("Medya yok");
    return { references: await references(tx, id) };
  });
}
export async function deleteMedia(actor: Actor, id: string) {
  requirePermission(actor, "media.write");
  const keys = await withTransaction(async (tx) => {
    const a = await asset(tx, uuid(id), true);
    if (!a || a.status === "deleted") throw new Error("Medya yok");
    if ((await references(tx, id)).length)
      throw new Error("Bağlı medya silinemez");
    await tx
      .update(mediaAssets)
      .set({ status: "deleted" })
      .where(eq(mediaAssets.id, id));
    await tx
      .update(mediaVariants)
      .set({ publishedAt: null })
      .where(eq(mediaVariants.assetId, id));
    await appendAudit(
      tx,
      actor,
      "media.deleted",
      { type: "media", id },
      { changedFields: ["media"] },
    );
    await enqueue(tx, "media.deleted", id, 1, { mediaId: id });
    return [a.originalKey, ...(await variants(tx, id)).map((v) => v.objectKey)];
  });
  await Promise.allSettled(keys.map(removePrivate));
}
export async function attachMedia(
  actor: Actor,
  content: { type: "announcement" | "game" | "featured_slot"; id: string },
  assetId: string,
): Promise<void> {
  requirePermission(actor, "media.write");
  z.enum(["announcement", "game", "featured_slot"]).parse(content.type);
  uuid(content.id);
  if (content.type === "game")
    return attachGameCover(actor, content.id, uuid(assetId));
  await withTransaction(async (tx) => {
    const a = await asset(tx, uuid(assetId), true);
    if (!a || a.status !== "ready") throw new Error("Medya yok");
    let eventId: string | null | undefined;
    if (content.type === "announcement")
      eventId = (
        await tx
          .select({ eventId: announcements.eventId })
          .from(announcements)
          .where(eq(announcements.id, content.id))
          .for("update")
      )[0]?.eventId;
    if (content.type === "featured_slot")
      eventId = (
        await tx
          .select({ eventId: featuredSlots.eventId })
          .from(featuredSlots)
          .where(eq(featuredSlots.id, content.id))
          .for("update")
      )[0]?.eventId;
    if (eventId === undefined) throw new Error("İçerik yok");
    requirePermission(actor, "media.attach", eventId ?? undefined);
    if (content.type === "announcement")
      await tx
        .update(announcements)
        .set({ mediaId: a.id, revision: sql`${announcements.revision}+1` })
        .where(eq(announcements.id, content.id));
    if (content.type === "featured_slot")
      await tx
        .update(featuredSlots)
        .set({ mediaId: a.id })
        .where(eq(featuredSlots.id, content.id));
    await appendAudit(
      tx,
      actor,
      "media.attached",
      { type: content.type, id: content.id },
      { changedFields: ["media"] },
    );
  });
}
