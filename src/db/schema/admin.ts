import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  jsonb,
  primaryKey,
  check,
  index,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";

export const admins = pgTable(
  "admins",
  {
    id: id(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    mfaSecretEncrypted: text("mfa_secret_encrypted"),
    recoveryCodeHashes: jsonb("recovery_code_hashes")
      .$type<string[]>()
      .default([])
      .notNull(),
    disabledAt: instant("disabled_at"),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "admin_email_normalized",
      sql`${t.email} = lower(btrim(${t.email})) AND ${t.email} <> ''`,
    ),
  ],
);
export const adminRoles = pgTable(
  "admin_roles",
  {
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id),
    role: text("role").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.adminId, t.role] }),
    check(
      "admin_role_allowed",
      sql`${t.role} IN ('content_editor','event_manager','system_admin')`,
    ),
  ],
);
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: id(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: createdAt(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
  },
  (t) => [
    check("admin_session_expiry", sql`${t.expiresAt} > ${t.createdAt}`),
    index("admin_sessions_admin_idx").on(t.adminId),
    index("admin_sessions_expiry_idx").on(t.expiresAt),
  ],
);
