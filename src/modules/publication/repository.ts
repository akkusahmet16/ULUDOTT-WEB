import "server-only";
import { sql } from "drizzle-orm";
import type { DbTx } from "../../lib/database/transaction.ts";
import type { ContentRecord, ContentType } from "./domain.ts";
export const table = (type: ContentType) =>
  sql.identifier(type === "event" ? "events" : "announcements");
export function record(row: Record<string, unknown>): ContentRecord {
  const out: Record<string, unknown> = {
    categoryId: null,
    description: null,
    body: "",
    kind: "general",
    location: null,
    locationType: "physical",
    organizer: null,
    startsAt: null,
    endsAt: null,
    capacity: null,
    maxTeamSize: 6,
    formId: null,
    eventId: null,
    ctaUrl: null,
    ctaLabel: null,
    featuredPosition: null,
  };
  for (const [k, v] of Object.entries(row)) {
    const name = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[name] = name.endsWith("At") && v ? new Date(v as string) : v;
  }
  return out as ContentRecord;
}
export async function find(
  tx: DbTx,
  type: ContentType,
  id: string,
  lock = false,
) {
  const rows = await tx.execute(
    sql`select * from ${table(type)} where id=${id} ${lock ? sql`for update` : sql``}`,
  );
  return rows[0] ? record(rows[0]) : null;
}
export async function all(tx: DbTx, type: ContentType) {
  const rows = await tx.execute(
    sql`select * from ${table(type)} order by created_at desc limit 100`,
  );
  return rows.map(record);
}
const columns: Record<string, string> = {
  title: "title",
  slug: "slug",
  excerpt: "excerpt",
  description: "description",
  body: "body",
  kind: "kind",
  categoryId: "category_id",
  location: "location",
  locationType: "location_type",
  organizer: "organizer",
  startsAt: "starts_at",
  endsAt: "ends_at",
  publishAt: "publish_at",
  unpublishAt: "unpublish_at",
  capacity: "capacity",
  maxTeamSize: "max_team_size",
  formId: "form_id",
  mediaId: "media_id",
  eventId: "event_id",
  ctaUrl: "cta_url",
  ctaLabel: "cta_label",
  seo: "seo",
};
const value = (v: unknown) =>
  v instanceof Date
    ? v.toISOString()
    : typeof v === "object" && v !== null
      ? JSON.stringify(v)
      : v;
export async function write(
  tx: DbTx,
  type: ContentType,
  input: Record<string, unknown>,
  id?: string,
) {
  const entries = Object.entries(input).filter(([k]) =>
    Object.hasOwn(columns, k),
  );
  const rows = id
    ? await tx.execute(
        sql`update ${table(type)} set ${sql.join(
          entries.map(
            ([k, v]) => sql`${sql.identifier(columns[k])}=${value(v)}`,
          ),
          sql`, `,
        )}, revision=revision+1 where id=${id} returning *`,
      )
    : await tx.execute(
        sql`insert into ${table(type)} (${sql.join(
          entries.map(([k]) => sql.identifier(columns[k])),
          sql`, `,
        )}) values (${sql.join(
          entries.map(([, v]) => sql`${value(v)}`),
          sql`, `,
        )}) returning *`,
      );
  return record(rows[0]);
}
