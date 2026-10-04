import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "../../../lib/database/client.ts";
import { events } from "../../../db/schema/content.ts";
import { forms } from "../../../db/schema/forms.ts";
import { outbox } from "../../../db/schema/operations.ts";
import { googleReadiness } from "../../../lib/config/wallet.ts";
import { loadServerConfig } from "../../../lib/config/server.ts";
import { requirePermission } from "../domain/permissions.ts";
import type { Actor } from "../../../lib/logging/audit.ts";
export type DashboardEvent = {
  id: string;
  title: string;
  status: string;
  upcoming: boolean;
  openForms: number | null;
  newSubmissions: number | null;
  pendingTeams: number | null;
  participants: number | null;
  capacity: number | null;
  full: boolean | null;
  failedWalletJobs: number | null;
};
export type DashboardForm = {
  id: string;
  eventId: string | null;
  title: string;
  open: boolean;
  used: number;
  capacity: number | null;
  full: boolean;
};
export type DashboardView = {
  events: DashboardEvent[];
  forms: DashboardForm[];
};
export type IntegrationStatus = {
  database: "reachable";
  googleWallet: string;
  appleWallet: "deferred";
  storage: "configured" | "unconfigured";
  jobs: { pending: number; processing: number; dead: number };
  failedJobs: { id: string; type: string; attempts: number }[];
};
export async function getDashboard(
  actor: Actor,
  eventScope?: string,
): Promise<DashboardView> {
  if (eventScope) z.uuid().parse(eventScope);
  const content = actor.roles.includes("content_editor");
  const scopes = actor.roles.includes("event_manager") ? actor.eventScopes : [];
  if (eventScope && !content && !scopes.includes(eventScope))
    throw Error("Yetki yok");
  if (!content && !scopes.length) return { events: [], forms: [] };
  const visible = content ? undefined : inArray(events.id, scopes);
  const personal = scopes.length ? inArray(events.id, scopes) : sql`false`;
  const participants = sql<number | null>`case when ${personal} then
    case when ${events.kind}='ulujam' then
      (select count(*)::int from applications a where a.event_id=${sql.raw('"events"."id"')} and a.status not in ('rejected','withdrawn'))
    else (select count(*)::int from submissions s where s.event_id=${sql.raw('"events"."id"')} and s.status in ('received','pending','approved') and s.expires_at>now()) end
    else null end`;
  const eventRows = await getDatabase()
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      capacity: events.capacity,
      upcoming: sql<boolean>`${events.startsAt}>now() and ${events.status} in ('published','scheduled')`,
      participants,
      openForms: sql<
        number | null
      >`case when ${personal} then (select count(*)::int from forms f where f.event_id=${sql.raw('"events"."id"')} and f.status='published' and f.current_version_id is not null and (f.opens_at is null or f.opens_at<=now()) and (f.closes_at is null or f.closes_at>now())) else null end`,
      newSubmissions: sql<
        number | null
      >`case when ${personal} then (select count(*)::int from submissions s where s.event_id=${sql.raw('"events"."id"')} and s.status in ('received','pending') and s.expires_at>now()) else null end`,
      pendingTeams: sql<
        number | null
      >`case when ${personal} then (select count(*)::int from teams t where t.event_id=${sql.raw('"events"."id"')} and t.status='pending') else null end`,
      // Match the worker's authoritative aggregate identity, never the mutable payload's eventId.
      failedWalletJobs: sql<
        number | null
      >`case when ${personal} then (select count(*)::int from outbox o join cards c on c.id=o.aggregate_id join applications a on a.id=c.application_id where a.event_id=${sql.raw('"events"."id"')} and o.type in ('card.changed','wallet.requested') and (o.status='dead' or (o.status='pending' and o.last_error_code is not null))) else null end`,
    })
    .from(events)
    .where(and(visible, eventScope ? eq(events.id, eventScope) : undefined))
    .orderBy(events.startsAt, events.id);
  const formScopes = eventScope
    ? scopes.filter((id) => id === eventScope)
    : scopes;
  const formRows = formScopes.length
    ? await getDatabase()
        .select({
          id: forms.id,
          eventId: forms.eventId,
          title: forms.title,
          capacity: forms.capacity,
          open: sql<boolean>`${forms.status}='published' and ${forms.currentVersionId} is not null and (${forms.opensAt} is null or ${forms.opensAt}<=now()) and (${forms.closesAt} is null or ${forms.closesAt}>now())`,
          used: sql<number>`(select count(*)::int from submissions s where s.form_id=${sql.raw('"forms"."id"')} and s.status in ('received','pending','approved') and s.expires_at>now())`,
        })
        .from(forms)
        .where(inArray(forms.eventId, formScopes))
        .orderBy(forms.title, forms.id)
    : [];
  return {
    events: eventRows.map((e) => ({
      ...e,
      upcoming: e.upcoming === true,
      full:
        e.participants === null
          ? null
          : e.capacity !== null && e.participants >= e.capacity,
    })),
    forms: formRows.map((f) => ({
      ...f,
      full: f.capacity !== null && f.used >= f.capacity,
    })),
  };
}
export async function getSystemStatus(
  actor: Actor,
): Promise<IntegrationStatus> {
  requirePermission(actor, "system.read");
  const db = getDatabase();
  await db.execute(sql`select 1`);
  const [counts] = await db
    .select({
      pending: sql<number>`count(*) filter (where status='pending')::int`,
      processing: sql<number>`count(*) filter (where status='processing')::int`,
      dead: sql<number>`count(*) filter (where status='dead')::int`,
    })
    .from(outbox);
  const failedJobs = await db
    .select({ id: outbox.id, type: outbox.type, attempts: outbox.attempts })
    .from(outbox)
    .where(eq(outbox.status, "dead"))
    .orderBy(outbox.createdAt, outbox.id)
    .limit(50);
  let storage: IntegrationStatus["storage"] = "unconfigured";
  try {
    loadServerConfig();
    storage = "configured";
  } catch {
    /* Only readiness is exposed. */
  }
  const knownTypes = [
    "card.changed",
    "wallet.requested",
    "game.credit_changed",
    "media.deleted",
  ];
  return {
    database: "reachable",
    googleWallet: googleReadiness(),
    appleWallet: "deferred",
    storage,
    jobs: counts,
    failedJobs: failedJobs.map((j) => ({
      ...j,
      type: knownTypes.includes(j.type) ? j.type : "unknown",
    })),
  };
}
