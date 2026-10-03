import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  primaryKey,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { admins } from "./admin.ts";
import { events } from "./content.ts";

export const adminEventScopes = pgTable(
  "admin_event_scopes",
  {
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
  },
  (t) => [
    primaryKey({ columns: [t.adminId, t.eventId] }),
    index("admin_scopes_event_idx").on(t.eventId),
  ],
);
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => admins.id),
    action: text("action").notNull(),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    changes: jsonb("changes").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_object_cursor_idx").on(t.objectType, t.objectId, t.createdAt),
    index("audit_actor_idx").on(t.actorId, t.createdAt),
  ],
);
export const outbox = pgTable(
  "outbox",
  {
    id: id(),
    type: text("type").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    revision: integer("revision").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    availableAt: instant("available_at").defaultNow().notNull(),
    leaseUntil: instant("lease_until"),
    leaseOwner: text("lease_owner"),
    lastErrorCode: text("last_error_code"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("outbox_type_aggregate_revision_unique").on(
      t.type,
      t.aggregateId,
      t.revision,
    ),
    check("outbox_revision", sql`${t.revision}>0`),
    check("outbox_attempts", sql`${t.attempts}>=0`),
    check(
      "outbox_status",
      sql`${t.status} IN ('pending','processing','completed','dead')`,
    ),
    index("outbox_ready_idx")
      .on(t.availableAt, t.createdAt)
      .where(sql`${t.status}='pending'`),
    index("outbox_lease_idx")
      .on(t.leaseUntil)
      .where(sql`${t.status}='processing'`),
  ],
);
export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    scope: text("scope").notNull(),
    keyHash: text("key_hash").notNull(),
    requestHash: text("request_hash").notNull(),
    resourceId: uuid("resource_id"),
    responseEncrypted: text("response_encrypted"),
    expiresAt: instant("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.keyHash] }),
    check("idempotency_expiry", sql`${t.expiresAt}>${t.createdAt}`),
    index("idempotency_resource_idx").on(t.resourceId),
    index("idempotency_expiry_idx").on(t.expiresAt),
  ],
);
export const rateLimits = pgTable(
  "rate_limits",
  {
    scope: text("scope").notNull(),
    keyHash: text("key_hash").notNull(),
    windowStartsAt: instant("window_starts_at").notNull(),
    count: integer("count").notNull(),
    expiresAt: instant("expires_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.keyHash, t.windowStartsAt] }),
    check("rate_limit_count", sql`${t.count}>=0`),
    check("rate_limit_expiry", sql`${t.expiresAt}>${t.windowStartsAt}`),
    index("rate_limits_expiry_idx").on(t.expiresAt),
  ],
);

// Retention worker has no human admin identity. Keep only aggregate operation evidence.
export const retentionRuns = pgTable(
  "retention_runs",
  {
    id: id(),
    completedAt: instant("completed_at").defaultNow().notNull(),
    deleted: integer("deleted").notNull(),
    anonymized: integer("anonymized").notNull(),
    pendingRevocations: integer("pending_revocations").notNull(),
  },
  (t) => [
    check(
      "retention_counts",
      sql`${t.deleted}>=0 AND ${t.anonymized}>=0 AND ${t.pendingRevocations}>=0`,
    ),
    index("retention_runs_time_idx").on(t.completedAt),
  ],
);
