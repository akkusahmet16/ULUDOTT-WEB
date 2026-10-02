import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  unique,
  primaryKey,
  foreignKey,
  check,
  index,
} from "drizzle-orm/pg-core";
import { id, createdAt, instant } from "./shared.ts";
import { events } from "./content.ts";

export const forms = pgTable(
  "forms",
  {
    id: id(),
    eventId: uuid("event_id").references((): AnyPgColumn => events.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    status: text("status").default("draft").notNull(),
    opensAt: instant("opens_at"),
    closesAt: instant("closes_at"),
    capacity: integer("capacity"),
    settings: jsonb("settings").default({}).notNull(),
    draftVersionId: uuid("draft_version_id"),
    currentVersionId: uuid("current_version_id"),
    revision: integer("revision").default(1).notNull(),
    createdAt: createdAt(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: "form_draft_version_fk",
      columns: [t.id, t.draftVersionId],
      foreignColumns: [formVersions.formId, formVersions.id],
    }),
    foreignKey({
      name: "form_current_version_fk",
      columns: [t.id, t.currentVersionId],
      foreignColumns: [formVersions.formId, formVersions.id],
    }),
    unique("form_event_identity_unique").on(t.eventId, t.id),
    check(
      "form_status",
      sql`${t.status} IN ('draft','published','paused','closed','archived')`,
    ),
    check(
      "form_window",
      sql`${t.closesAt} IS NULL OR (${t.opensAt} IS NOT NULL AND ${t.closesAt}>${t.opensAt})`,
    ),
    check("form_capacity", sql`${t.capacity} IS NULL OR ${t.capacity}>0`),
    check("form_revision", sql`${t.revision}>0`),
    index("forms_event_idx").on(t.eventId),
  ],
);
export const formVersions = pgTable(
  "form_versions",
  {
    id: id(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    publishedAt: instant("published_at"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("form_version_number_unique").on(t.formId, t.version),
    unique("form_version_identity_unique").on(t.formId, t.id),
    check("form_version_positive", sql`${t.version}>0`),
  ],
);
export const formFields = pgTable(
  "form_fields",
  {
    versionId: uuid("version_id")
      .notNull()
      .references(() => formVersions.id),
    fieldKey: uuid("field_key").notNull(),
    type: text("type").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull(),
    config: jsonb("config").default({}).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versionId, t.fieldKey] }),
    unique("form_field_position_unique").on(t.versionId, t.position),
    check("form_field_position", sql`${t.position}>=0`),
    check(
      "form_field_type",
      sql`${t.type} IN ('short_text','long_text','email','phone','number','date','single_choice','multiple_choice','dropdown','checkbox','radio','rating','info','section','consent')`,
    ),
  ],
);
export const formRules = pgTable(
  "form_rules",
  {
    id: id(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => formVersions.id),
    ast: jsonb("ast").notNull(),
  },
  (t) => [index("form_rules_version_idx").on(t.versionId)],
);
export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id),
    versionId: uuid("version_id").notNull(),
    eventId: uuid("event_id").references((): AnyPgColumn => events.id),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    status: text("status").default("received").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    receiptTokenHash: text("receipt_token_hash").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "submission_form_event_fk",
      columns: [t.eventId, t.formId],
      foreignColumns: [forms.eventId, forms.id],
    }),
    foreignKey({
      name: "submission_form_version_fk",
      columns: [t.formId, t.versionId],
      foreignColumns: [formVersions.formId, formVersions.id],
    }),
    unique("submission_version_identity_unique").on(t.id, t.versionId),
    unique("submission_event_identity_unique").on(t.eventId, t.id),
    check(
      "submission_status",
      sql`${t.status} IN ('received','pending','approved','rejected','withdrawn')`,
    ),
    index("submissions_cursor_idx").on(t.formId, t.createdAt, t.id),
    index("submissions_email_idx").on(t.eventId, t.email),
  ],
);
export const submissionAnswers = pgTable(
  "submission_answers",
  {
    submissionId: uuid("submission_id").notNull(),
    versionId: uuid("version_id").notNull(),
    fieldKey: uuid("field_key").notNull(),
    value: jsonb("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.submissionId, t.fieldKey] }),
    foreignKey({
      name: "answer_submission_version_fk",
      columns: [t.submissionId, t.versionId],
      foreignColumns: [submissions.id, submissions.versionId],
    }),
    foreignKey({
      name: "answer_version_field_fk",
      columns: [t.versionId, t.fieldKey],
      foreignColumns: [formFields.versionId, formFields.fieldKey],
    }),
  ],
);
export const submissionStatusHistory = pgTable(
  "submission_status_history",
  {
    id: id(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id),
    status: text("status").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "history_status",
      sql`${t.status} IN ('received','pending','approved','rejected','withdrawn')`,
    ),
    index("submission_history_idx").on(t.submissionId, t.createdAt),
  ],
);
export const consents = pgTable(
  "consents",
  {
    id: id(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id),
    purpose: text("purpose").notNull(),
    textVersion: text("text_version").notNull(),
    grantedAt: instant("granted_at").notNull(),
    withdrawnAt: instant("withdrawn_at"),
  },
  (t) => [
    unique("consent_submission_purpose_version_unique").on(
      t.submissionId,
      t.purpose,
      t.textVersion,
    ),
    check(
      "consent_withdrawal",
      sql`${t.withdrawnAt} IS NULL OR ${t.withdrawnAt}>=${t.grantedAt}`,
    ),
  ],
);
