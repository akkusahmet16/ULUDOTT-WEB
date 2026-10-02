import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  integer,
  unique,
  check,
  index,
  foreignKey,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { events } from "./content.ts";
import { submissions } from "./forms.ts";
import { admins } from "./admin.ts";

export const applications = pgTable(
  "applications",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    submissionId: uuid("submission_id").unique(),
    fullName: text("full_name").notNull(),
    revision: integer("revision").default(1).notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    mode: text("mode").notNull(),
    status: text("status").default("pending").notNull(),
    skillDescription: text("skill_description"),
    reviewNote: text("review_note"),
    tokenHash: text("token_hash").unique(),
    approvedBy: uuid("approved_by").references(() => admins.id),
    approvedAt: instant("approved_at"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("application_event_email_unique").on(t.eventId, t.email),
    unique("application_event_identity_unique").on(t.eventId, t.id),
    foreignKey({
      name: "application_submission_event_fk",
      columns: [t.eventId, t.submissionId],
      foreignColumns: [submissions.eventId, submissions.id],
    }),
    check(
      "application_email_normalized",
      sql`${t.email}=lower(btrim(${t.email})) AND ${t.email} ~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'`,
    ),
    check("application_name", sql`length(btrim(${t.fullName}))>0`),
    check("application_phone", sql`${t.phone} ~ '^\\+[1-9][0-9]{7,14}$'`),
    check(
      "application_mode",
      sql`${t.mode} IN ('solo','seeking','new','existing')`,
    ),
    check(
      "application_status",
      sql`${t.status} IN ('pending','approved','rejected','withdrawn','changes_requested')`,
    ),
    check("application_revision", sql`${t.revision}>0`),
    index("applications_cursor_idx").on(t.eventId, t.createdAt, t.id),
    index("applications_status_idx").on(t.eventId, t.status),
  ],
);
export const applicationSkills = pgTable(
  "application_skills",
  {
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    skill: text("skill").notNull(),
    level: integer("level").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.applicationId, t.skill] }),
    check("skill_level", sql`${t.level} BETWEEN 1 AND 5`),
    check("skill_name", sql`length(btrim(${t.skill}))>0`),
  ],
);
export const teams = pgTable(
  "teams",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    expectedSize: integer("expected_size").notNull(),
    status: text("status").default("pending").notNull(),
    rosterRevision: integer("roster_revision").default(1).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("team_event_name_unique").on(t.eventId, t.normalizedName),
    unique("team_event_identity_unique").on(t.eventId, t.id),
    check("team_size", sql`${t.expectedSize}>=1`),
    check(
      "team_name",
      sql`length(btrim(${t.name}))>0 AND length(btrim(${t.normalizedName}))>0`,
    ),
    check("team_revision", sql`${t.rosterRevision}>0`),
    check(
      "team_status",
      sql`${t.status} IN ('pending','approved','rejected','changes_requested','withdrawn')`,
    ),
    index("teams_review_idx").on(t.eventId, t.status, t.createdAt),
  ],
);
export const teamApprovals = pgTable(
  "team_approvals",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    revision: integer("revision").notNull(),
    status: text("status").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => admins.id),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.revision] }),
    check("team_approval_revision", sql`${t.revision}>0`),
    check(
      "team_approval_status",
      sql`${t.status} IN ('pending','approved','rejected','changes_requested')`,
    ),
  ],
);
export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    teamId: uuid("team_id").notNull(),
    applicationId: uuid("application_id").notNull(),
    approvedRevision: integer("approved_revision"),
    joinedAt: instant("joined_at").defaultNow().notNull(),
    leftAt: instant("left_at"),
  },
  (t) => [
    foreignKey({
      name: "membership_team_event_fk",
      columns: [t.eventId, t.teamId],
      foreignColumns: [teams.eventId, teams.id],
    }),
    foreignKey({
      name: "membership_application_event_fk",
      columns: [t.eventId, t.applicationId],
      foreignColumns: [applications.eventId, applications.id],
    }),
    foreignKey({
      name: "membership_approval_fk",
      columns: [t.teamId, t.approvedRevision],
      foreignColumns: [teamApprovals.teamId, teamApprovals.revision],
    }),
    uniqueIndex("membership_one_active_application")
      .on(t.applicationId)
      .where(sql`${t.leftAt} IS NULL`),
    index("memberships_team_idx").on(t.teamId, t.leftAt),
    index("memberships_application_idx").on(t.applicationId),
    check(
      "membership_dates",
      sql`${t.leftAt} IS NULL OR ${t.leftAt}>=${t.joinedAt}`,
    ),
  ],
);
export const teamAccess = pgTable(
  "team_access",
  {
    teamId: uuid("team_id")
      .primaryKey()
      .references(() => teams.id),
    tokenHash: text("token_hash").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    tokenEncrypted: text("token_encrypted"),
    revision: integer("revision").default(1).notNull(),
    rotatedAt: instant("rotated_at").defaultNow().notNull(),
  },
  (t) => [check("team_access_revision", sql`${t.revision}>0`)],
);
export const teamSessions = pgTable(
  "team_sessions",
  {
    id: id(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    tokenHash: text("token_hash").notNull().unique(),
    accessRevision: integer("access_revision").notNull(),
    createdAt: createdAt(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
  },
  (t) => [
    check("team_session_expiry", sql`${t.expiresAt}>${t.createdAt}`),
    check("team_session_revision", sql`${t.accessRevision}>0`),
    index("team_sessions_team_idx").on(t.teamId),
    index("team_sessions_expiry_idx").on(t.expiresAt),
  ],
);
