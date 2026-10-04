import "server-only";
import { createHash } from "node:crypto";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../lib/database/client.ts";
import { withTransaction } from "../../lib/database/transaction.ts";
import { peopleOverrides } from "../../db/schema/people.ts";
import { appendAudit, type Actor } from "../../lib/logging/audit.ts";
import { requirePermission } from "../admin/domain/permissions.ts";
import {
  peopleChapters,
  type Chapter,
  type Member,
} from "./people-reference-data.ts";

const imagePath = z
  .string()
  .max(300)
  .regex(
    /^\/(?:community|theme\/reference)\/[a-zA-Z0-9/_-]+\.(?:avif|webp|png|jpe?g)$|^\/media\/[0-9a-f-]{36}$/,
  );
const videoPath = z
  .string()
  .max(300)
  .regex(/^\/(?:community|theme\/reference)\/[a-zA-Z0-9/_-]+\.(?:mp4|webm)$/);
const chapterInput = z.strictObject({
  title: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  video: videoPath,
  poster: imagePath,
});
const memberInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  quote: z.string().trim().max(400),
  details: z.array(z.string().trim().min(1).max(200)).max(5),
  photo: imagePath,
});
export type PeopleEntry = {
  slot: string;
  kind: "chapter" | "member";
  revision: number;
  fields: z.infer<typeof chapterInput> | z.infer<typeof memberInput>;
};
const slotInfo = new Map<
  string,
  { kind: "chapter"; chapter: Chapter } | { kind: "member"; member: Member }
>(
  peopleChapters.flatMap(
    (chapter) =>
      [
        [`chapter:${chapter.slug}`, { kind: "chapter" as const, chapter }],
        ...chapter.members.map(
          (member) =>
            [
              `member:${member.slug}`,
              { kind: "member" as const, member },
            ] as const,
        ),
      ] as const,
  ),
);
function auditId(slot: string) {
  const hex = createHash("sha256")
    .update(`uludott-people:${slot}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
function defaultEntry(slot: string): PeopleEntry | null {
  const info = slotInfo.get(slot);
  if (!info) return null;
  if (info.kind === "chapter") {
    const { title, role, video, poster } = info.chapter;
    return {
      slot,
      kind: "chapter",
      revision: 0,
      fields: { title, role, video, poster },
    };
  }
  const { name, role, quote, details, photo } = info.member;
  return {
    slot,
    kind: "member",
    revision: 0,
    fields: { name, role, quote: quote ?? "", details, photo },
  };
}
function merge(rows: { slot: string; data: unknown; revision: number }[]) {
  const overrides = new Map(rows.map((row) => [row.slot, row]));
  return [...slotInfo.keys()].map((slot) => {
    const entry = defaultEntry(slot)!;
    const row = overrides.get(slot);
    if (!row) return entry;
    const parsed = (
      entry.kind === "chapter" ? chapterInput : memberInput
    ).safeParse(row.data);
    return parsed.success
      ? { ...entry, revision: row.revision, fields: parsed.data }
      : entry;
  });
}
export async function listPeopleContent(actor: Actor) {
  requirePermission(actor, "content.write");
  return merge(await getDatabase().select().from(peopleOverrides));
}
export async function getPeopleContent(): Promise<Chapter[]> {
  const entries = merge(await getDatabase().select().from(peopleOverrides));
  const bySlot = new Map(entries.map((entry) => [entry.slot, entry]));
  return peopleChapters.map((chapter) => {
    const fields = bySlot.get(`chapter:${chapter.slug}`)?.fields as z.infer<
      typeof chapterInput
    >;
    return {
      ...chapter,
      ...fields,
      videoReference: fields.video.startsWith("/theme/reference/"),
      members: chapter.members.map((member) => {
        const detail = bySlot.get(`member:${member.slug}`)?.fields as z.infer<
          typeof memberInput
        >;
        return {
          ...member,
          ...detail,
          quote: detail.quote || undefined,
          photoReference: detail.photo.startsWith("/theme/reference/"),
        };
      }),
    };
  });
}
export async function savePeopleContent(
  actor: Actor,
  slot: string,
  input: unknown,
  expectedRevision: number,
) {
  requirePermission(actor, "content.write");
  const entry = defaultEntry(slot);
  if (!entry) throw Error("Bilinmeyen alan");
  const fields = (entry.kind === "chapter" ? chapterInput : memberInput).parse(
    input,
  );
  const paths =
    entry.kind === "chapter"
      ? [
          (fields as z.infer<typeof chapterInput>).video,
          (fields as z.infer<typeof chapterInput>).poster,
        ]
      : [(fields as z.infer<typeof memberInput>).photo];
  for (const path of paths) {
    if (path.startsWith("/media/")) {
      const id = path.slice(7);
      const ready = await getDatabase().execute(
        // Only published image variants may appear in public People slots.
        sql`select id from media_variants where id=${id} and published_at is not null and mime_type='image/webp'`,
      );
      if (!ready.length) throw Error("Medya yayında değil");
    } else {
      try {
        await access(join(process.cwd(), "public", path));
      } catch {
        throw Error("Medya dosyası bulunamadı");
      }
    }
  }
  return withTransaction(async (tx) => {
    if (expectedRevision === 0) {
      const inserted = await tx
        .insert(peopleOverrides)
        .values({ slot, data: fields })
        .onConflictDoNothing()
        .returning();
      if (!inserted.length) throw Error("Sürüm çakışması");
      await appendAudit(
        tx,
        actor,
        "people.saved",
        { type: "people", id: auditId(slot) },
        { revision: 1 },
      );
      return { ...entry, revision: 1, fields };
    }
    const [current] = await tx
      .select()
      .from(peopleOverrides)
      .where(eq(peopleOverrides.slot, slot))
      .for("update");
    if (!current || current.revision !== expectedRevision)
      throw Error("Sürüm çakışması");
    const [saved] = await tx
      .update(peopleOverrides)
      .set({ data: fields, revision: current.revision + 1 })
      .where(eq(peopleOverrides.slot, slot))
      .returning();
    await appendAudit(
      tx,
      actor,
      "people.saved",
      { type: "people", id: auditId(slot) },
      { revision: saved.revision },
    );
    return { ...entry, revision: saved.revision, fields };
  });
}
