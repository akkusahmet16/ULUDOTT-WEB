import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  events,
  eventYears,
  mediaAssets,
  mediaVariants,
} from "../../../db/schema/content.ts";
import { eventGallery } from "../../../db/schema/gallery.ts";
export type GalleryImage = { id: string; src: string; alt: string };
export async function publishedYearStart(year: number): Promise<Date | null> {
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select e.starts_at from events e join event_years y on y.event_id=e.id where y.year=${year} and e.kind='ulujam' and e.status in ('scheduled','published','ended') and e.publish_at<=now() and (e.unpublish_at is null or e.unpublish_at>now())`,
    );
    return rows[0]?.starts_at ? new Date(rows[0].starts_at as string) : null;
  });
}
export async function galleryImages(year: number): Promise<GalleryImage[]> {
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select v.id,a.alt_text from event_gallery g join events e on e.id=g.event_id join event_years y on y.event_id=e.id join media_assets a on a.id=g.media_id join media_variants v on v.asset_id=a.id where y.year=${year} and e.kind='ulujam' and e.status!='archived' and g.verified_at<=now() and a.status='ready' and nullif(btrim(a.alt_text),'') is not null and v.purpose='webp' and v.mime_type='image/webp' and v.published_at<=now() order by g.position limit 50`,
    );
    return rows.map((r) => ({
      id: r.id as string,
      src: "/media/" + r.id,
      alt: r.alt_text as string,
    }));
  });
}
const inputSchema = z.strictObject({
  eventId: z.uuid(),
  mediaId: z.uuid().nullable(),
  position: z.int().min(0).max(49),
  verified: z.boolean(),
  expectedRevision: z.int().positive().optional(),
});
export async function saveGallery(actor: Actor, input: unknown): Promise<void> {
  const d = inputSchema.parse(input);
  requirePermission(actor, "media.attach", d.eventId);
  await withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(90202609)`);
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, d.eventId));
    const [year] = await tx
      .select()
      .from(eventYears)
      .where(eq(eventYears.eventId, d.eventId));
    if (!event || event.kind !== "ulujam" || !year)
      throw Error("UluJam yılı yok");
    const where = and(
      eq(eventGallery.eventId, d.eventId),
      eq(eventGallery.position, d.position),
    );
    const [existing] = await tx
      .select()
      .from(eventGallery)
      .where(where)
      .for("update");
    if (existing && existing.revision !== d.expectedRevision)
      throw Error("Sürüm çakışması");
    if (d.mediaId) {
      const [media] = await tx
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, d.mediaId))
        .for("update");
      if (!media || media.status !== "ready" || !media.altText?.trim())
        throw Error("Medya uygun değil");
      const [variant] = await tx
        .select()
        .from(mediaVariants)
        .where(
          and(
            eq(mediaVariants.assetId, d.mediaId),
            eq(mediaVariants.purpose, "webp"),
          ),
        );
      if (!variant || variant.mimeType !== "image/webp")
        throw Error("Medya uygun değil");
      const values = {
        mediaId: d.mediaId,
        verifiedAt: d.verified ? sql`now()` : null,
      };
      const [row] = existing
        ? await tx
            .update(eventGallery)
            .set({ ...values, revision: sql`${eventGallery.revision}+1` })
            .where(where)
            .returning()
        : await tx
            .insert(eventGallery)
            .values({ ...values, eventId: d.eventId, position: d.position })
            .returning();
      await appendAudit(
        tx,
        actor,
        "gallery.saved",
        { type: "gallery", id: row.id },
        { revision: row.revision, changedFields: ["media"] },
      );
    } else if (existing) {
      await tx.delete(eventGallery).where(where);
      await appendAudit(
        tx,
        actor,
        "gallery.removed",
        { type: "gallery", id: existing.id },
        { revision: existing.revision },
      );
    }
  });
}
export async function galleryInventory(actor: Actor, eventId: string) {
  z.uuid().parse(eventId);
  requirePermission(actor, "media.attach", eventId);
  return withTransaction((tx) =>
    tx
      .select()
      .from(eventGallery)
      .where(eq(eventGallery.eventId, eventId))
      .orderBy(eventGallery.position),
  );
}
