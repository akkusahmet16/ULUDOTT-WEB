import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { withTransaction, type DbTx } from "../../lib/database/transaction.ts";
import { appendAudit, type Actor } from "../../lib/logging/audit.ts";
import { requirePermission } from "../admin/domain/permissions.ts";
import {
  eventInput,
  announcementInput,
  visible,
  displayStatus,
  type ContentType,
  type ContentRecord,
  type PublicContent,
} from "./domain.ts";
import { find, all, write, table, record } from "./repository.ts";
const checkRevision = (row: ContentRecord, revision: unknown) => {
  if (
    !z.int().positive().safeParse(revision).success ||
    row.revision !== revision
  )
    throw Error("Sürüm çakışması");
};
const permission = (
  actor: Actor,
  type: ContentType,
  row?: ContentRecord | null,
) =>
  requirePermission(
    actor,
    "publication.write",
    type === "event" ? row?.id : (row?.eventId ?? undefined),
  );
async function media(tx: DbTx, id: string | null, published = false) {
  if (!id) return;
  const a = await tx.execute(
    sql`select * from media_assets where id=${id} for update`,
  );
  if (a[0]?.status !== "ready") throw Error("Afiş hazır değil");
  if (published) {
    const v = await tx.execute(
      sql`select id from media_variants where asset_id=${id} and mime_type='image/webp' and published_at is not null`,
    );
    if (!v.length || !a[0].alt_text) throw Error("Afiş yayımlanmalı");
  }
}
async function liveCta(tx: DbTx, url: string | null, now: Date) {
  if (!url) return true;
  const match = /^\/(etkinlikler|duyurular)\/([a-z0-9-]+)$/.exec(url);
  if (!match) return true;
  const targetType = match[1] === "etkinlikler" ? "event" : "announcement";
  const rows = await tx.execute(
    sql`select * from ${table(targetType)} where slug=${match[2]}`,
  );
  return !!rows[0] && visible(record(rows[0]), now);
}
export async function save(
  type: ContentType,
  actor: Actor,
  input: unknown,
  id?: string,
  revision?: number,
) {
  const data =
    type === "event" ? eventInput.parse(input) : announcementInput.parse(input);
  if (id) z.uuid().parse(id);
  return withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${type}))`);
    const current = id ? await find(tx, type, id) : null;
    if (id && !current) throw Error("İçerik yok");
    if (current) permission(actor, type, current);
    else
      requirePermission(
        actor,
        "publication.write",
        "eventId" in data ? (data.eventId ?? undefined) : undefined,
      );
    if (type === "announcement" && "eventId" in data)
      requirePermission(actor, "publication.write", data.eventId ?? undefined);
    await media(
      tx,
      data.mediaId,
      !!current && !["draft", "archived"].includes(current.status),
    );
    if (current) {
      const locked = (await find(tx, type, current.id, true))!;
      checkRevision(locked, revision);
      if (!["draft", "archived"].includes(current.status) && !data.publishAt)
        data.publishAt = current.publishAt;
    }
    const aliases = await tx.execute(
      sql`select content_id from content_redirects where content_type=${type} and old_slug=${data.slug}`,
    );
    if (aliases.length && aliases[0].content_id !== id)
      throw Error("Slug kullanılıyor");
    const used = await tx.execute(
      sql`select id from ${table(type)} where slug=${data.slug}`,
    );
    if (used.length && used[0].id !== id) throw Error("Slug kullanılıyor");
    if (current && current.slug !== data.slug) {
      await tx.execute(
        sql`delete from content_redirects where content_type=${type} and old_slug=${data.slug} and content_id=${id}`,
      );
      await tx.execute(
        sql`insert into content_redirects(content_type,content_id,old_slug) values(${type},${id},${current.slug}) on conflict(content_type,old_slug) do nothing`,
      );
    }
    if (type === "event" && "formId" in data && data.formId) {
      const f = await tx.execute(
        sql`select id from forms where id=${data.formId} and event_id=${id ?? null}`,
      );
      if (!f.length) throw Error("Form aynı etkinliğe bağlı olmalı");
    }
    if (
      current &&
      current.status !== "draft" &&
      current.status !== "archived" &&
      type === "event" &&
      "startsAt" in data &&
      (!data.startsAt || !data.location)
    )
      throw Error("Yayın için tarih ve konum gerekli");
    const result = await write(tx, type, data, id);
    if (type === "event" && "featuredPosition" in data) {
      await tx.execute(
        sql`delete from featured_slots where event_id=${result.id}`,
      );
      if (data.featuredPosition !== null)
        await tx.execute(
          sql`insert into featured_slots(event_id,position) values(${result.id},${data.featuredPosition})`,
        );
      result.featuredPosition = data.featuredPosition;
    }
    await appendAudit(
      tx,
      actor,
      `${type}.saved`,
      { type, id: result.id },
      { revision: result.revision, changedFields: ["title", "slug"] },
    );
    return result;
  });
}
export async function preview(type: ContentType, id: string, actor: Actor) {
  z.uuid().parse(id);
  return withTransaction(async (tx) => {
    const row = await find(tx, type, id);
    if (!row) throw Error("İçerik yok");
    permission(actor, type, row);
    if (type === "event") {
      const slot = await tx.execute(
        sql`select position from featured_slots where event_id=${id}`,
      );
      row.featuredPosition = (slot[0]?.position as number) ?? null;
    }
    return row;
  });
}
export async function list(type: ContentType, actor: Actor) {
  if (!actor.roles.some((r) => ["content_editor", "event_manager"].includes(r)))
    throw Error("Yetki yok");
  return withTransaction(async (tx) =>
    (await all(tx, type)).filter((row) => {
      try {
        permission(actor, type, row);
        return true;
      } catch {
        return false;
      }
    }),
  );
}
export async function transition(
  type: ContentType,
  id: string,
  actor: Actor,
  revision: number,
  status: "publish" | "draft" | "ended" | "cancelled" | "archived",
) {
  z.uuid().parse(id);
  return withTransaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${type}))`);
    const initial = await find(tx, type, id);
    if (!initial) throw Error("İçerik yok");
    permission(actor, type, initial);
    if (status === "publish") await media(tx, initial.mediaId, true);
    const row = (await find(tx, type, id, true))!;
    checkRevision(row, revision);
    if (type === "announcement" && ["ended", "cancelled"].includes(status))
      throw Error("Geçersiz durum");
    let next: string = status,
      publishAt = row.publishAt;
    if (status === "publish") {
      if (type === "event" && (!row.startsAt || !row.location?.trim()))
        throw Error("Yayın için tarih ve konum gerekli");
      if (
        type === "announcement" &&
        !(await liveCta(tx, row.ctaUrl, row.publishAt ?? new Date()))
      )
        throw Error("CTA hedefi yayında değil");
      if (type === "announcement" && !row.body.trim())
        throw Error("İçerik gerekli");
      publishAt ??= new Date();
      if (row.unpublishAt && row.unpublishAt <= new Date())
        throw Error("Yayın penceresi bitti");
      next = publishAt > new Date() ? "scheduled" : "published";
    }
    if (status === "draft") publishAt = null;
    const rows = await tx.execute(
      sql`update ${table(type)} set status=${next}, publish_at=${publishAt?.toISOString() ?? null}, unpublish_at=${status === "draft" ? null : (row.unpublishAt?.toISOString() ?? null)},revision=revision+1 where id=${id} returning *`,
    );
    const result = record(rows[0]);
    await appendAudit(
      tx,
      actor,
      `${type}.status_changed`,
      { type, id },
      {
        revision: result.revision,
        previousRevision: row.revision,
        status: next,
      },
    );
    return result;
  });
}
async function enrich(
  tx: DbTx,
  row: ContentRecord,
  now: Date,
): Promise<PublicContent> {
  if (!(await liveCta(tx, row.ctaUrl, now)))
    row = { ...row, ctaUrl: null, ctaLabel: null };
  let image: PublicContent["image"] = null;
  if (row.mediaId) {
    const v = await tx.execute(
      sql`select v.id,v.width,v.height,a.alt_text from media_variants v join media_assets a on a.id=v.asset_id where a.id=${row.mediaId} and a.status='ready' and v.published_at is not null and v.mime_type='image/webp'`,
    );
    if (v[0])
      image = {
        id: v[0].id as string,
        width: v[0].width as number,
        height: v[0].height as number,
        altText: v[0].alt_text as string,
      };
  }
  let applicationUrl: string | null = null;
  if (
    row.kind === "general" &&
    row.formId &&
    displayStatus(row, now) === "published"
  ) {
    const [f] = await tx.execute(
      sql`select f.slug from forms f join form_versions v on v.id=f.current_version_id and v.form_id=f.id where f.id=${row.formId} and f.event_id=${row.id} and f.status='published' and v.published_at is not null and f.opens_at<=${now.toISOString()}::timestamptz and (f.closes_at is null or f.closes_at>${now.toISOString()}::timestamptz)`,
    );
    if (f && /^[a-z0-9-]{1,100}$/.test(String(f.slug)))
      applicationUrl = "/basvuru/" + f.slug;
  }
  return {
    ...row,
    displayStatus: displayStatus(row, now),
    applicationUrl,
    image,
  };
}
export async function publicBySlug(
  type: ContentType,
  slug: string,
  now = new Date(),
) {
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select * from ${table(type)} where slug=${slug}`,
    );
    let row = rows[0] ? record(rows[0]) : null;
    let redirectSlug: string | undefined;
    if (!row) {
      const aliases = await tx.execute(
        sql`select content_id from content_redirects where content_type=${type} and old_slug=${slug}`,
      );
      if (aliases[0]) {
        row = await find(tx, type, aliases[0].content_id as string);
        redirectSlug = row?.slug;
      }
    }
    if (!row || !visible(row, now)) return null;
    return { ...(await enrich(tx, row, now)), redirectSlug };
  });
}
export async function publicList(type: ContentType, now = new Date()) {
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select * from ${table(type)} where status in ('scheduled','published','ended','cancelled') and publish_at<=${now.toISOString()} and (unpublish_at is null or unpublish_at>${now.toISOString()}) order by publish_at desc,id limit 100`,
    );
    return Promise.all(rows.map(record).map((row) => enrich(tx, row, now)));
  });
}
export async function featured(now = new Date()) {
  return withTransaction(async (tx) => {
    const rows = await tx.execute(
      sql`select e.*,s.position as featured_position from featured_slots s join events e on e.id=s.event_id order by s.position`,
    );
    return Promise.all(
      rows
        .map(record)
        .filter(
          (x) =>
            visible(x, now) &&
            displayStatus(x, now) !== "ended" &&
            x.status !== "cancelled" &&
            !!x.startsAt &&
            x.startsAt > now,
        )
        .map((x) => enrich(tx, x, now)),
    );
  });
}

export async function editorOptions(actor: Actor) {
  if (!actor.roles.some((r) => ["content_editor", "event_manager"].includes(r)))
    throw Error("Yetki yok");
  return withTransaction(async (tx) => {
    const categories = await tx.execute(
      sql`select id,name from event_categories order by name limit 100`,
    );
    const scoped = actor.roles.includes("content_editor")
      ? sql``
      : sql`where event_id in (${
          actor.eventScopes.length
            ? sql.join(
                actor.eventScopes.map((id) => sql`${id}::uuid`),
                sql`, `,
              )
            : sql`null::uuid`
        })`;
    const rows = await tx.execute(
      sql`select id,title,event_id from forms ${scoped} order by title limit 100`,
    );
    return {
      categories: categories.map((x) => ({
        id: x.id as string,
        name: x.name as string,
      })),
      forms: rows.map((x) => ({
        id: x.id as string,
        title: x.title as string,
        eventId: x.event_id as string | null,
      })),
    };
  });
}
