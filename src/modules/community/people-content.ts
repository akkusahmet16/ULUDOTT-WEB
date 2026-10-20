import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../lib/database/client.ts";
import { withTransaction } from "../../lib/database/transaction.ts";
import { peopleOverrides } from "../../db/schema/people.ts";
import { appendAudit, type Actor } from "../../lib/logging/audit.ts";
import { requirePermission } from "../admin/domain/permissions.ts";
import { assertSiteAsset } from "../media/application/site-assets.ts";
import { peopleChapters, type Chapter } from "./people-reference-data.ts";
import {
  chapterInput,
  memberInput,
  type PeopleEntry,
} from "./people-domain.ts";
export type { PeopleEntry } from "./people-domain.ts";

const defaults = new Map<string, PeopleEntry>(
  peopleChapters.flatMap(
    (chapter) =>
      [
        [
          `chapter:${chapter.slug}`,
          {
            slot: `chapter:${chapter.slug}`,
            kind: "chapter" as const,
            revision: 0,
            fields: {
              title: chapter.title,
              role: chapter.role,
              video: chapter.video,
              videoVisible: chapter.videoVisible ?? true,
              poster: chapter.poster,
            },
          },
        ],
        ...chapter.members.map(
          (member, index) =>
            [
              `member:${member.slug}`,
              {
                slot: `member:${member.slug}`,
                kind: "member" as const,
                revision: 0,
                fields: {
                  name: member.name,
                  role: member.role,
                  quote: member.quote ?? "",
                  details: member.details,
                  photo: member.photo,
                  chapterSlug: chapter.slug,
                  position: (index + 1) * 10,
                },
              },
            ] as const,
        ),
      ] as const,
  ),
);

function merge(rows: { slot: string; data: unknown; revision: number }[]) {
  const entries = new Map(defaults);
  for (const row of rows) {
    const base = defaults.get(row.slot);
    const kind =
      base?.kind ?? (row.slot.startsWith("member:person-") ? "member" : null);
    if (!kind || typeof row.data !== "object" || row.data === null) continue;
    const { deleted, ...data } = row.data as Record<string, unknown>;
    const parsed = (kind === "chapter" ? chapterInput : memberInput).safeParse({
      ...base?.fields,
      ...data,
    });
    if (!parsed.success) continue;
    entries.set(row.slot, {
      slot: row.slot,
      kind,
      revision: row.revision,
      fields: parsed.data,
      deleted: deleted === true,
    } as PeopleEntry);
  }
  return [...entries.values()];
}
async function entries() {
  return merge(await getDatabase().select().from(peopleOverrides));
}
function auditId(slot: string) {
  const hex = createHash("sha256")
    .update(`uludott-people:${slot}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export async function listPeopleContent(actor: Actor) {
  requirePermission(actor, "content.write");
  return (await entries()).filter((entry) => !entry.deleted);
}
export async function getPeopleContent(): Promise<Chapter[]> {
  const all = await entries();
  return peopleChapters
    .map((chapter) => {
      const entry = all.find((e) => e.slot === `chapter:${chapter.slug}`)!;
      if (entry.kind !== "chapter") throw Error("Bilinmeyen alan");
      return {
        ...chapter,
        ...entry.fields,
        video: entry.fields.videoVisible ? entry.fields.video : "",
        videoReference: entry.fields.video.startsWith("/theme/reference/"),
        members: all
          .filter(
            (e): e is Extract<PeopleEntry, { kind: "member" }> =>
              e.kind === "member" &&
              !e.deleted &&
              e.fields.chapterSlug === chapter.slug,
          )
          .sort(
            (a, b) =>
              a.fields.position - b.fields.position ||
              a.slot.localeCompare(b.slot),
          )
          .map((e) => ({
            slug: e.slot.slice(7),
            ...e.fields,
            quote: e.fields.quote || undefined,
            photoReference: e.fields.photo.startsWith("/theme/reference/"),
          })),
      };
    })
    .filter((chapter) => chapter.members.length > 0 || !!chapter.video);
}
async function validateMedia(entry: PeopleEntry) {
  if (entry.kind === "chapter") {
    if (entry.fields.video)
      await assertSiteAsset(entry.fields.video, "people", "video");
    if (entry.fields.poster) await validatePhoto(entry.fields.poster);
  } else {
    if (!peopleChapters.some((c) => c.slug === entry.fields.chapterSlug))
      throw Error("Bilinmeyen bölüm");
    if (entry.fields.photo) await validatePhoto(entry.fields.photo);
  }
}
async function validatePhoto(path: string) {
  if (/^\/media\/[0-9a-f-]{36}$/.test(path)) {
    const ready = await getDatabase().execute(
      sql`select v.id from media_variants v join media_assets a on a.id=v.asset_id where v.id=${path.slice(7)}::uuid and v.published_at<=now() and v.mime_type='image/webp' and a.status='ready'`,
    );
    if (!ready.length) throw Error("Medya yayında değil");
  } else await assertSiteAsset(path, "people", "image");
}
async function persist(
  actor: Actor,
  entry: PeopleEntry,
  expectedRevision: number,
  deleted = false,
) {
  z.int().nonnegative().parse(expectedRevision);
  return withTransaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${entry.slot}))`,
    );
    const [current] = await tx
      .select()
      .from(peopleOverrides)
      .where(eq(peopleOverrides.slot, entry.slot))
      .for("update");
    if ((current?.revision ?? 0) !== expectedRevision)
      throw Error("Sürüm çakışması");
    const revision = expectedRevision + 1;
    const data = { ...entry.fields, ...(deleted ? { deleted: true } : {}) };
    if (current)
      await tx
        .update(peopleOverrides)
        .set({ data, revision })
        .where(eq(peopleOverrides.slot, entry.slot));
    else
      await tx
        .insert(peopleOverrides)
        .values({ slot: entry.slot, data, revision });
    await appendAudit(
      tx,
      actor,
      deleted ? "people.removed" : "people.saved",
      { type: "people", id: auditId(entry.slot) },
      { revision },
    );
    return { ...entry, revision, deleted };
  });
}
export async function savePeopleContent(
  actor: Actor,
  slot: string,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  const entry = (await entries()).find((e) => e.slot === slot && !e.deleted);
  if (!entry) throw Error("Bilinmeyen alan");
  const raw = z.record(z.string(), z.unknown()).parse(input);
  const fields = (entry.kind === "chapter" ? chapterInput : memberInput).parse({
    ...entry.fields,
    ...raw,
  });
  const next = { ...entry, fields } as PeopleEntry;
  await validateMedia(next);
  return persist(actor, next, expectedRevision);
}
export async function savePeopleMember(actor: Actor, input: unknown) {
  requirePermission(actor, "content.write");
  const entry: PeopleEntry = {
    slot: `member:person-${randomUUID()}`,
    kind: "member",
    revision: 0,
    fields: memberInput.parse(input),
  };
  await validateMedia(entry);
  return persist(actor, entry, 0);
}
export async function removePeopleMember(
  actor: Actor,
  slot: string,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  const entry = (await entries()).find((e) => e.slot === slot && !e.deleted);
  if (!entry || entry.kind !== "member") throw Error("Bilinmeyen alan");
  return persist(actor, entry, expectedRevision, true);
}
