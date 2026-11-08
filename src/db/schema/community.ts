import { sql } from "drizzle-orm";
import { pgTable, text, uuid, index, check } from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";

export const communityMembers = pgTable(
  "community_members",
  {
    id: id(),
    fullName: text("full_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    email: text("email").notNull().unique(),
    facultyDepartment: text("faculty_department"),
    registrationDate: text("registration_date"),
    period: text("period").default("2026 - 2027").notNull(),
    role: text("role").default("member").notNull(),
    status: text("status").default("active").notNull(),
    lastSyncedAt: instant("last_synced_at").defaultNow().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("community_members_email_idx").on(t.email),
    index("community_members_normalized_name_idx").on(t.normalizedName),
    check("community_member_status", sql`${t.status} IN ('active', 'revoked')`),
  ],
);

export const memberCardGrants = pgTable(
  "member_card_grants",
  {
    id: id(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => communityMembers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status").default("active").notNull(),
    createdAt: createdAt(),
    lastAccessedAt: instant("last_accessed_at"),
  },
  (t) => [
    index("member_card_grants_token_idx").on(t.tokenHash),
    check("member_card_grant_status", sql`${t.status} IN ('active', 'revoked')`),
  ],
);
