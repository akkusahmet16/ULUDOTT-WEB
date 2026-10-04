import "server-only";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import { links, linkGroups } from "../../../db/schema/links.ts";
import {
  withTransaction,
  type DbTx,
} from "../../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../../lib/logging/audit.ts";
import { requirePermission } from "../../admin/domain/permissions.ts";
import {
  linkInput,
  groupInput,
  validLinkUrl,
  staticPaths,
  type LinkItem,
  type LinkGroup,
} from "../domain/link.ts";
import {
  linkRecord,
  groupRecord,
  inventory,
} from "../infrastructure/link-repository.ts";
const lock = (tx: DbTx) =>
  tx.execute(sql`select pg_advisory_xact_lock(52891476)`);
function revision(row: { revision: number } | undefined, expected?: number) {
  if (!row) throw Error("Kayıt yok");
  if (row.revision !== expected) throw Error("Sürüm çakışması");
}
async function targetAvailable(tx: DbTx, url: string, now: Date) {
  if (!validLinkUrl(url)) return false;
  if (!url.startsWith("/") || staticPaths.has(url)) return true;
  const match = /^\/(etkinlikler)\/([a-z0-9-]+)$/.exec(url);
  if (!match) return false;
  const table = sql.identifier("events");
  const rows = await tx.execute(
    sql`select id from ${table} where slug=${match[2]} and status in ('scheduled','published','ended','cancelled') and publish_at<=${now.toISOString()} and (unpublish_at is null or unpublish_at>${now.toISOString()})`,
  );
  return !!rows.length;
}
export async function saveGroup(actor: Actor, input: unknown) {
  requirePermission(actor, "links.write");
  const d = groupInput.parse(input);
  return withTransaction(async (tx) => {
    await lock(tx);
    const all = await inventory(tx);
    if (!d.id && all.groups.length >= 50) throw Error("Kategori sınırı");
    if (d.id) revision(await groupRecord(tx, d.id), d.expectedRevision);
    if (all.groups.some((g) => g.position === d.position && g.id !== d.id))
      throw Error("Sıra kullanılıyor");
    const values = { title: d.title, position: d.position };
    const [g] = d.id
      ? await tx
          .update(linkGroups)
          .set({ ...values, revision: sql`${linkGroups.revision}+1` })
          .where(eq(linkGroups.id, d.id))
          .returning()
      : await tx.insert(linkGroups).values(values).returning();
    await appendAudit(
      tx,
      actor,
      "link_group.saved",
      { type: "link_group", id: g.id },
      { revision: g.revision, changedFields: ["title"] },
    );
    return g;
  });
}
export async function saveLink(actor: Actor, input: unknown) {
  requirePermission(actor, "links.write");
  const d = linkInput.parse(input);
  if (d.published && !d.url.startsWith("/") && !d.verified)
    throw Error("Dış adresi doğrulayın");
  return withTransaction(async (tx) => {
    await lock(tx);
    const all = await inventory(tx);
    if (!d.id && all.links.length >= 200) throw Error("Bağlantı sınırı");
    if (!(await groupRecord(tx, d.groupId))) throw Error("Kategori yok");
    if (d.id) revision(await linkRecord(tx, d.id), d.expectedRevision);
    if (
      all.links.some(
        (l) =>
          l.groupId === d.groupId && l.position === d.position && l.id !== d.id,
      )
    )
      throw Error("Sıra kullanılıyor");
    const time =
      d.startsAt && d.startsAt > new Date() ? d.startsAt : new Date();
    if (d.published && !(await targetAvailable(tx, d.url, time)))
      throw Error("Bağlantı hedefi yayında değil");
    const values = {
      groupId: d.groupId,
      title: d.title,
      url: d.url,
      description: d.description,
      icon: d.icon,
      position: d.position,
      published: d.published,
      featured: d.featured,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      verifiedAt: d.published ? new Date() : null,
    };
    const [l] = d.id
      ? await tx
          .update(links)
          .set({ ...values, revision: sql`${links.revision}+1` })
          .where(eq(links.id, d.id))
          .returning()
      : await tx.insert(links).values(values).returning();
    await appendAudit(
      tx,
      actor,
      "link.saved",
      { type: "link", id: l.id },
      { revision: l.revision, changedFields: ["title", "description"] },
    );
    return l;
  });
}
export async function listLinks(actor: Actor) {
  requirePermission(actor, "links.write");
  return withTransaction(inventory);
}
export async function hideLink(
  actor: Actor,
  id: string,
  expectedRevision: number,
) {
  requirePermission(actor, "links.write");
  z.uuid().parse(id);
  return withTransaction(async (tx) => {
    await lock(tx);
    revision(await linkRecord(tx, id), expectedRevision);
    const [l] = await tx
      .update(links)
      .set({ published: false, revision: sql`${links.revision}+1` })
      .where(eq(links.id, id))
      .returning();
    await appendAudit(
      tx,
      actor,
      "link.hidden",
      { type: "link", id },
      { revision: l.revision },
    );
    return l;
  });
}
const orderInput = z
  .array(z.uuid())
  .min(1)
  .max(200)
  .refine((ids) => new Set(ids).size === ids.length);
const snapshots = z.record(z.uuid(), z.int().positive());
async function reorder(
  actor: Actor,
  idsInput: unknown,
  expectedInput: unknown,
  groups: boolean,
) {
  requirePermission(actor, "links.write");
  const ids = orderInput.parse(idsInput),
    expected = snapshots.parse(expectedInput);
  return withTransaction(async (tx) => {
    await lock(tx);
    const all = await inventory(tx);
    const first = all.links.find((l) => l.id === ids[0]);
    const rows = groups
      ? all.groups
      : all.links.filter((l) => l.groupId === first?.groupId);
    if (
      rows.length !== ids.length ||
      rows.some((r) => !ids.includes(r.id)) ||
      Object.keys(expected).length !== ids.length
    )
      throw Error("Eksik veya geçersiz sıra");
    for (const r of rows) revision(r, expected[r.id]);
    const table = groups ? linkGroups : links;
    const offset = Math.max(...rows.map((r) => r.position)) + rows.length + 1;
    await tx
      .update(table)
      .set({ position: sql`${table.position}+${offset}` })
      .where(groups ? sql`true` : eq(links.groupId, first!.groupId));
    for (let i = 0; i < ids.length; i++)
      await tx
        .update(table)
        .set({ position: i, revision: sql`${table.revision}+1` })
        .where(eq(table.id, ids[i]));
    await appendAudit(
      tx,
      actor,
      groups ? "link_group.reordered" : "link.reordered",
      { type: groups ? "link_group" : "link", id: ids[0] },
      { changedFields: ["revision"] },
    );
  });
}
export const reorderLinks = (
  actor: Actor,
  orderedIds: string[],
  expectedRevisions: Record<string, number>,
) => reorder(actor, orderedIds, expectedRevisions, false);
export const reorderGroups = (
  actor: Actor,
  orderedIds: string[],
  expectedRevisions: Record<string, number>,
) => reorder(actor, orderedIds, expectedRevisions, true);
async function published(tx: DbTx, now: Date, id?: string) {
  const rows = await tx
    .select()
    .from(links)
    .where(
      sql`${links.published}=true and (${links.startsAt} is null or ${links.startsAt}<=${now.toISOString()}) and (${links.endsAt} is null or ${links.endsAt}>${now.toISOString()}) ${id ? sql`and ${links.id}=${id}` : sql``}`,
    )
    .orderBy(links.position, links.id);
  const result: LinkItem[] = [];
  for (const row of rows)
    if (
      (row.url.startsWith("/") || !!row.verifiedAt) &&
      (await targetAvailable(tx, row.url, now))
    )
      result.push(row);
  return result;
}
export async function getPublishedLink(id: string, now = new Date()) {
  if (!z.uuid().safeParse(id).success) return null;
  return withTransaction(
    async (tx) => (await published(tx, now, id))[0] ?? null,
  );
}
export async function getPublishedLinks(
  now = new Date(),
): Promise<LinkGroup[]> {
  return withTransaction(async (tx) => {
    const rows = await published(tx, now);
    const groups = await tx
      .select()
      .from(linkGroups)
      .orderBy(linkGroups.position, linkGroups.id);
    return groups
      .map((g) => ({ ...g, links: rows.filter((l) => l.groupId === g.id) }))
      .filter((g) => g.links.length);
  });
}
