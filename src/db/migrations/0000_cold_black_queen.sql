CREATE TABLE "admin_roles" (
	"admin_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "admin_roles_admin_id_role_pk" PRIMARY KEY("admin_id","role"),
	CONSTRAINT "admin_role_allowed" CHECK ("admin_roles"."role" IN ('content_editor','event_manager','system_admin'))
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "admin_session_expiry" CHECK ("admin_sessions"."expires_at" > "admin_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"mfa_secret_encrypted" text,
	"recovery_code_hashes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_email_normalized" CHECK ("admins"."email" = lower(btrim("admins"."email")) AND "admins"."email" <> '')
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body" text NOT NULL,
	"media_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"unpublish_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug"),
	CONSTRAINT "announcement_status" CHECK ("announcements"."status" IN ('draft','scheduled','published','archived')),
	CONSTRAINT "announcement_window" CHECK ("announcements"."unpublish_at" IS NULL OR ("announcements"."publish_at" IS NOT NULL AND "announcements"."unpublish_at">"announcements"."publish_at")),
	CONSTRAINT "announcement_revision" CHECK ("announcements"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	CONSTRAINT "award_event_rank_unique" UNIQUE("event_id","rank"),
	CONSTRAINT "award_game_unique" UNIQUE("game_id"),
	CONSTRAINT "award_rank" CHECK ("awards"."rank" BETWEEN 1 AND 3)
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "event_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"year" integer NOT NULL,
	CONSTRAINT "event_years_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "event_years_year_unique" UNIQUE("year"),
	CONSTRAINT "event_year_range" CHECK ("event_years"."year" BETWEEN 2000 AND 2200)
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"kind" text NOT NULL,
	"category_id" uuid,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"publish_at" timestamp with time zone,
	"unpublish_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"capacity" integer,
	"max_team_size" integer DEFAULT 6 NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "event_status" CHECK ("events"."status" IN ('draft','scheduled','published','ended','cancelled','archived')),
	CONSTRAINT "event_kind" CHECK ("events"."kind" IN ('general','ulujam')),
	CONSTRAINT "event_dates" CHECK ("events"."ends_at" IS NULL OR ("events"."starts_at" IS NOT NULL AND "events"."ends_at" > "events"."starts_at")),
	CONSTRAINT "event_publish_window" CHECK ("events"."unpublish_at" IS NULL OR ("events"."publish_at" IS NOT NULL AND "events"."unpublish_at" > "events"."publish_at")),
	CONSTRAINT "event_capacity" CHECK ("events"."capacity" IS NULL OR "events"."capacity" > 0),
	CONSTRAINT "event_team_size" CHECK ("events"."max_team_size" >= 1),
	CONSTRAINT "event_revision" CHECK ("events"."revision" >= 1)
);
--> statement-breakpoint
CREATE TABLE "featured_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"media_id" uuid,
	CONSTRAINT "featured_slots_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "featured_slots_position_unique" UNIQUE("position"),
	CONSTRAINT "featured_position" CHECK ("featured_slots"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "finalists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "finalists_game_id_unique" UNIQUE("game_id"),
	CONSTRAINT "finalist_event_position_unique" UNIQUE("event_id","position"),
	CONSTRAINT "finalist_position" CHECK ("finalists"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "game_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"application_id" uuid,
	"publication_name" text,
	"consented_at" timestamp with time zone,
	CONSTRAINT "credit_consent_name" CHECK ("game_credits"."consented_at" IS NULL OR nullif(btrim("game_credits"."publication_name"),'') IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_id" uuid,
	"title" text,
	"itch_url" text NOT NULL,
	"description" text,
	"media_id" uuid,
	"historical_partial" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_event_id_unique" UNIQUE("event_id","id"),
	CONSTRAINT "game_revision" CHECK ("games"."revision">0),
	CONSTRAINT "game_itch_url" CHECK ("games"."itch_url" ~ '^https://[a-zA-Z0-9-]+\.itch\.io/[A-Za-z0-9_/?=&%.-]+$')
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"alt_text" text,
	"status" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_original_key_unique" UNIQUE("original_key"),
	CONSTRAINT "media_size" CHECK ("media_assets"."byte_size" > 0),
	CONSTRAINT "media_status" CHECK ("media_assets"."status" IN ('private','processing','ready','rejected','deleted'))
);
--> statement-breakpoint
CREATE TABLE "media_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"object_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"mime_type" text NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "media_variants_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "media_variant_purpose_unique" UNIQUE("asset_id","purpose"),
	CONSTRAINT "media_dimensions" CHECK ("media_variants"."width">0 AND "media_variants"."height">0)
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"text_version" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "consent_submission_purpose_version_unique" UNIQUE("submission_id","purpose","text_version"),
	CONSTRAINT "consent_withdrawal" CHECK ("consents"."withdrawn_at" IS NULL OR "consents"."withdrawn_at">="consents"."granted_at")
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"version_id" uuid NOT NULL,
	"field_key" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "form_fields_version_id_field_key_pk" PRIMARY KEY("version_id","field_key"),
	CONSTRAINT "form_field_position_unique" UNIQUE("version_id","position"),
	CONSTRAINT "form_field_position" CHECK ("form_fields"."position">=0),
	CONSTRAINT "form_field_type" CHECK ("form_fields"."type" IN ('short_text','long_text','email','phone','number','date','single_choice','multiple_choice','dropdown','checkbox','radio','rating','info','section','consent'))
);
--> statement-breakpoint
CREATE TABLE "form_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"ast" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_version_number_unique" UNIQUE("form_id","version"),
	CONSTRAINT "form_version_identity_unique" UNIQUE("form_id","id"),
	CONSTRAINT "form_version_positive" CHECK ("form_versions"."version">0)
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"capacity" integer,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forms_slug_unique" UNIQUE("slug"),
	CONSTRAINT "form_status" CHECK ("forms"."status" IN ('draft','published','closed','archived')),
	CONSTRAINT "form_window" CHECK ("forms"."closes_at" IS NULL OR ("forms"."opens_at" IS NOT NULL AND "forms"."closes_at">"forms"."opens_at")),
	CONSTRAINT "form_capacity" CHECK ("forms"."capacity" IS NULL OR "forms"."capacity">0),
	CONSTRAINT "form_revision" CHECK ("forms"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"submission_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"field_key" uuid NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "submission_answers_submission_id_field_key_pk" PRIMARY KEY("submission_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "submission_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "history_status" CHECK ("submission_status_history"."status" IN ('received','pending','approved','rejected','withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"event_id" uuid,
	"full_name" text,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'received' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"receipt_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_receipt_token_hash_unique" UNIQUE("receipt_token_hash"),
	CONSTRAINT "submission_version_identity_unique" UNIQUE("id","version_id"),
	CONSTRAINT "submission_event_identity_unique" UNIQUE("event_id","id"),
	CONSTRAINT "submission_status" CHECK ("submissions"."status" IN ('received','pending','approved','rejected','withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "application_skills" (
	"application_id" uuid NOT NULL,
	"skill" text NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "application_skills_application_id_skill_pk" PRIMARY KEY("application_id","skill"),
	CONSTRAINT "skill_level" CHECK ("application_skills"."level" BETWEEN 1 AND 5),
	CONSTRAINT "skill_name" CHECK (length(btrim("application_skills"."skill"))>0)
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"submission_id" uuid,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"skill_description" text,
	"token_hash" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "applications_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "application_event_email_unique" UNIQUE("event_id","email"),
	CONSTRAINT "application_event_identity_unique" UNIQUE("event_id","id"),
	CONSTRAINT "application_email_normalized" CHECK ("applications"."email"=lower(btrim("applications"."email")) AND "applications"."email" ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
	CONSTRAINT "application_name" CHECK (length(btrim("applications"."full_name"))>0),
	CONSTRAINT "application_phone" CHECK ("applications"."phone" ~ '^\+[1-9][0-9]{7,14}$'),
	CONSTRAINT "application_mode" CHECK ("applications"."mode" IN ('solo','seeking','new','existing')),
	CONSTRAINT "application_status" CHECK ("applications"."status" IN ('pending','approved','rejected','withdrawn','changes_requested'))
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"approved_revision" integer,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "membership_dates" CHECK ("memberships"."left_at" IS NULL OR "memberships"."left_at">="memberships"."joined_at")
);
--> statement-breakpoint
CREATE TABLE "team_access" (
	"team_id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"password_hash" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_access_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "team_access_revision" CHECK ("team_access"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "team_approvals" (
	"team_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"status" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_approvals_team_id_revision_pk" PRIMARY KEY("team_id","revision"),
	CONSTRAINT "team_approval_revision" CHECK ("team_approvals"."revision">0),
	CONSTRAINT "team_approval_status" CHECK ("team_approvals"."status" IN ('pending','approved','rejected','changes_requested'))
);
--> statement-breakpoint
CREATE TABLE "team_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"access_revision" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "team_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "team_session_expiry" CHECK ("team_sessions"."expires_at">"team_sessions"."created_at"),
	CONSTRAINT "team_session_revision" CHECK ("team_sessions"."access_revision">0)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"expected_size" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"roster_revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_event_name_unique" UNIQUE("event_id","normalized_name"),
	CONSTRAINT "team_event_identity_unique" UNIQUE("event_id","id"),
	CONSTRAINT "team_size" CHECK ("teams"."expected_size">=1),
	CONSTRAINT "team_name" CHECK (length(btrim("teams"."name"))>0 AND length(btrim("teams"."normalized_name"))>0),
	CONSTRAINT "team_revision" CHECK ("teams"."roster_revision">0),
	CONSTRAINT "team_status" CHECK ("teams"."status" IN ('pending','approved','rejected','changes_requested','withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "apple_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_library_id" text NOT NULL,
	"push_token_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apple_devices_device_library_id_unique" UNIQUE("device_library_id")
);
--> statement-breakpoint
CREATE TABLE "apple_registrations" (
	"device_id" uuid NOT NULL,
	"pass_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apple_registrations_device_id_pass_id_pk" PRIMARY KEY("device_id","pass_id")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"checkin_token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_application_id_unique" UNIQUE("application_id"),
	CONSTRAINT "cards_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "cards_checkin_token_hash_unique" UNIQUE("checkin_token_hash"),
	CONSTRAINT "card_status" CHECK ("cards"."status" IN ('pending','active','revoked')),
	CONSTRAINT "card_revision" CHECK ("cards"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "wallet_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"object_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"auth_token_hash" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_card_provider_unique" UNIQUE("card_id","provider"),
	CONSTRAINT "wallet_provider_object_unique" UNIQUE("provider","object_id"),
	CONSTRAINT "wallet_provider" CHECK ("wallet_passes"."provider" IN ('apple','google')),
	CONSTRAINT "wallet_status" CHECK ("wallet_passes"."status" IN ('pending','ready','failed','revoked')),
	CONSTRAINT "wallet_revision" CHECK ("wallet_passes"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "link_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "link_group_position" CHECK ("link_groups"."position">=0)
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"icon" text,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	CONSTRAINT "link_position" CHECK ("links"."position">=0),
	CONSTRAINT "link_url" CHECK ("links"."url" ~ '^https://[^[:space:]]+$' OR "links"."url" ~ '^/[^/[:space:]][^[:space:]]*$' OR "links"."url"='/'),
	CONSTRAINT "link_window" CHECK ("links"."ends_at" IS NULL OR ("links"."starts_at" IS NOT NULL AND "links"."ends_at">"links"."starts_at"))
);
--> statement-breakpoint
CREATE TABLE "admin_event_scopes" (
	"admin_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	CONSTRAINT "admin_event_scopes_admin_id_event_id_pk" PRIMARY KEY("admin_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" uuid NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"scope" text NOT NULL,
	"key_hash" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_encrypted" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_records_scope_key_hash_pk" PRIMARY KEY("scope","key_hash"),
	CONSTRAINT "idempotency_expiry" CHECK ("idempotency_records"."expires_at">"idempotency_records"."created_at")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_owner" text,
	"last_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_type_aggregate_revision_unique" UNIQUE("type","aggregate_id","revision"),
	CONSTRAINT "outbox_revision" CHECK ("outbox"."revision">0),
	CONSTRAINT "outbox_attempts" CHECK ("outbox"."attempts">=0),
	CONSTRAINT "outbox_status" CHECK ("outbox"."status" IN ('pending','processing','completed','dead'))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"scope" text NOT NULL,
	"key_hash" text NOT NULL,
	"window_starts_at" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limits_scope_key_hash_window_starts_at_pk" PRIMARY KEY("scope","key_hash","window_starts_at"),
	CONSTRAINT "rate_limit_count" CHECK ("rate_limits"."count">=0),
	CONSTRAINT "rate_limit_expiry" CHECK ("rate_limits"."expires_at">"rate_limits"."window_starts_at")
);
--> statement-breakpoint
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_years" ADD CONSTRAINT "event_years_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalists" ADD CONSTRAINT "finalists_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalists" ADD CONSTRAINT "finalists_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_credits" ADD CONSTRAINT "game_credits_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_credits" ADD CONSTRAINT "game_credits_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_asset_id_media_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_version_id_form_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_rules" ADD CONSTRAINT "form_rules_version_id_form_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "answer_submission_version_fk" FOREIGN KEY ("submission_id","version_id") REFERENCES "public"."submissions"("id","version_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "answer_version_field_fk" FOREIGN KEY ("version_id","field_key") REFERENCES "public"."form_fields"("version_id","field_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_status_history" ADD CONSTRAINT "submission_status_history_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_form_version_fk" FOREIGN KEY ("form_id","version_id") REFERENCES "public"."form_versions"("form_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_skills" ADD CONSTRAINT "application_skills_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "application_submission_event_fk" FOREIGN KEY ("event_id","submission_id") REFERENCES "public"."submissions"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "membership_team_event_fk" FOREIGN KEY ("event_id","team_id") REFERENCES "public"."teams"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "membership_application_event_fk" FOREIGN KEY ("event_id","application_id") REFERENCES "public"."applications"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "membership_approval_fk" FOREIGN KEY ("team_id","approved_revision") REFERENCES "public"."team_approvals"("team_id","revision") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_access" ADD CONSTRAINT "team_access_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_approvals" ADD CONSTRAINT "team_approvals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_approvals" ADD CONSTRAINT "team_approvals_actor_id_admins_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_sessions" ADD CONSTRAINT "team_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apple_registrations" ADD CONSTRAINT "apple_registrations_device_id_apple_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."apple_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apple_registrations" ADD CONSTRAINT "apple_registrations_pass_id_wallet_passes_id_fk" FOREIGN KEY ("pass_id") REFERENCES "public"."wallet_passes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_passes_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_group_id_link_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."link_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_event_scopes" ADD CONSTRAINT "admin_event_scopes_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_event_scopes" ADD CONSTRAINT "admin_event_scopes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_admins_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "announcements_publication_idx" ON "announcements" USING btree ("status","publish_at");--> statement-breakpoint
CREATE INDEX "announcements_event_idx" ON "announcements" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_publication_idx" ON "events" USING btree ("status","publish_at");--> statement-breakpoint
CREATE INDEX "events_start_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_category_idx" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "game_credits_game_idx" ON "game_credits" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "games_event_idx" ON "games" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "form_rules_version_idx" ON "form_rules" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "forms_event_idx" ON "forms" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "submission_history_idx" ON "submission_status_history" USING btree ("submission_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_cursor_idx" ON "submissions" USING btree ("form_id","created_at","id");--> statement-breakpoint
CREATE INDEX "submissions_email_idx" ON "submissions" USING btree ("event_id","email");--> statement-breakpoint
CREATE INDEX "applications_cursor_idx" ON "applications" USING btree ("event_id","created_at","id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "memberships_team_idx" ON "memberships" USING btree ("team_id","left_at");--> statement-breakpoint
CREATE INDEX "memberships_application_idx" ON "memberships" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "team_sessions_team_idx" ON "team_sessions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_sessions_expiry_idx" ON "team_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "teams_review_idx" ON "teams" USING btree ("event_id","status","created_at");--> statement-breakpoint
CREATE INDEX "apple_registrations_pass_idx" ON "apple_registrations" USING btree ("pass_id");--> statement-breakpoint
CREATE INDEX "links_public_order_idx" ON "links" USING btree ("group_id","published","position");--> statement-breakpoint
CREATE INDEX "admin_scopes_event_idx" ON "admin_event_scopes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "audit_object_cursor_idx" ON "audit_logs" USING btree ("object_type","object_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "idempotency_expiry_idx" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "outbox_ready_idx" ON "outbox" USING btree ("available_at","created_at") WHERE "outbox"."status"='pending';--> statement-breakpoint
CREATE INDEX "outbox_lease_idx" ON "outbox" USING btree ("lease_until") WHERE "outbox"."status"='processing';--> statement-breakpoint
CREATE INDEX "rate_limits_expiry_idx" ON "rate_limits" USING btree ("expires_at");