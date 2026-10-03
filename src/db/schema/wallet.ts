import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  unique,
  primaryKey,
  check,
  index,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { applications } from "./ulujam.ts";

export const cards = pgTable(
  "cards",
  {
    id: id(),
    applicationId: uuid("application_id")
      .notNull()
      .unique()
      .references(() => applications.id),
    tokenHash: text("token_hash").notNull().unique(),
    checkinTokenHash: text("checkin_token_hash").notNull().unique(),
    checkinTokenEncrypted: text("checkin_token_encrypted"),
    status: text("status").default("pending").notNull(),
    revision: integer("revision").default(1).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("card_status", sql`${t.status} IN ('pending','active','revoked')`),
    check("card_revision", sql`${t.revision}>0`),
  ],
);
export const walletPasses = pgTable(
  "wallet_passes",
  {
    id: id(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    provider: text("provider").notNull(),
    objectId: text("object_id").notNull(),
    status: text("status").default("pending").notNull(),
    revision: integer("revision").default(1).notNull(),
    syncedRevision: integer("synced_revision").default(0).notNull(),
    lastErrorCode: text("last_error_code"),
    providerState: text("provider_state").default("unknown").notNull(),
    authTokenHash: text("auth_token_hash"),
    updatedAt: instant("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("wallet_card_provider_unique").on(t.cardId, t.provider),
    unique("wallet_provider_object_unique").on(t.provider, t.objectId),
    check("wallet_provider", sql`${t.provider} IN ('apple','google')`),
    check(
      "wallet_status",
      sql`${t.status} IN ('pending','ready','failed','revoked')`,
    ),
    check(
      "wallet_provider_state",
      sql`${t.providerState} IN ('unknown','active','revoked')`,
    ),
    check("wallet_revision", sql`${t.revision}>0`),
    check(
      "wallet_synced_revision",
      sql`${t.syncedRevision}>=0 AND ${t.syncedRevision}<=${t.revision}`,
    ),
  ],
);
export const appleDevices = pgTable("apple_devices", {
  id: id(),
  deviceLibraryId: text("device_library_id").notNull().unique(),
  pushTokenEncrypted: text("push_token_encrypted").notNull(),
  createdAt: createdAt(),
});
export const appleRegistrations = pgTable(
  "apple_registrations",
  {
    deviceId: uuid("device_id")
      .notNull()
      .references(() => appleDevices.id),
    passId: uuid("pass_id")
      .notNull()
      .references(() => walletPasses.id),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.deviceId, t.passId] }),
    index("apple_registrations_pass_idx").on(t.passId),
  ],
);
