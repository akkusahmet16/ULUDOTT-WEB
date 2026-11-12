CREATE TABLE "sozluk_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid,
	"nick" text NOT NULL,
	"normalized_nick" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"rank" text DEFAULT 'caylak' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"muted_until" timestamp with time zone,
	"approved_entry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_authors_nick_unique" UNIQUE("nick"),
	CONSTRAINT "sozluk_authors_normalized_nick_unique" UNIQUE("normalized_nick"),
	CONSTRAINT "sozluk_authors_email_unique" UNIQUE("email"),
	CONSTRAINT "sozluk_author_rank" CHECK ("sozluk_authors"."rank" IN ('caylak', 'yazar', 'moderator', 'admin')),
	CONSTRAINT "sozluk_author_status" CHECK ("sozluk_authors"."status" IN ('active', 'muted', 'banned')),
	CONSTRAINT "sozluk_author_approved_count" CHECK ("sozluk_authors"."approved_entry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sozluk_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_channels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sozluk_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_entry_status" CHECK ("sozluk_entries"."status" IN ('published', 'pending', 'hidden', 'deleted')),
	CONSTRAINT "sozluk_entry_upvotes_nonneg" CHECK ("sozluk_entries"."upvotes" >= 0),
	CONSTRAINT "sozluk_entry_downvotes_nonneg" CHECK ("sozluk_entries"."downvotes" >= 0),
	CONSTRAINT "sozluk_entry_favorites_nonneg" CHECK ("sozluk_entries"."favorites_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sozluk_entry_favorites" (
	"entry_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_entry_favorites_entry_id_author_id_pk" PRIMARY KEY("entry_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "sozluk_entry_votes" (
	"entry_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_entry_votes_entry_id_author_id_pk" PRIMARY KEY("entry_id","author_id"),
	CONSTRAINT "sozluk_entry_vote_value" CHECK ("sozluk_entry_votes"."value" IN (-1, 1))
);
--> statement-breakpoint
CREATE TABLE "sozluk_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"reporter_author_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by_admin_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_report_reason" CHECK ("sozluk_reports"."reason" IN ('spam', 'harassment', 'rule_violation', 'spoiler', 'other')),
	CONSTRAINT "sozluk_report_status" CHECK ("sozluk_reports"."status" IN ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "sozluk_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "sozluk_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "sozluk_session_expiry" CHECK ("sozluk_sessions"."expires_at" > "sozluk_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "sozluk_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"normalized_title" text NOT NULL,
	"channel_id" uuid,
	"created_by_author_id" uuid,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"merged_into_topic_id" uuid,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"last_entry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sozluk_topics_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sozluk_topics_normalized_title_unique" UNIQUE("normalized_title"),
	CONSTRAINT "sozluk_topic_entry_count" CHECK ("sozluk_topics"."entry_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sozluk_authors" ADD CONSTRAINT "sozluk_authors_member_id_community_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."community_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entries" ADD CONSTRAINT "sozluk_entries_topic_id_sozluk_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."sozluk_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entries" ADD CONSTRAINT "sozluk_entries_author_id_sozluk_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entry_favorites" ADD CONSTRAINT "sozluk_entry_favorites_entry_id_sozluk_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."sozluk_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entry_favorites" ADD CONSTRAINT "sozluk_entry_favorites_author_id_sozluk_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entry_votes" ADD CONSTRAINT "sozluk_entry_votes_entry_id_sozluk_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."sozluk_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_entry_votes" ADD CONSTRAINT "sozluk_entry_votes_author_id_sozluk_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_reports" ADD CONSTRAINT "sozluk_reports_entry_id_sozluk_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."sozluk_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_reports" ADD CONSTRAINT "sozluk_reports_reporter_author_id_sozluk_authors_id_fk" FOREIGN KEY ("reporter_author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_reports" ADD CONSTRAINT "sozluk_reports_resolved_by_admin_id_admins_id_fk" FOREIGN KEY ("resolved_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_sessions" ADD CONSTRAINT "sozluk_sessions_author_id_sozluk_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_topics" ADD CONSTRAINT "sozluk_topics_channel_id_sozluk_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."sozluk_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_topics" ADD CONSTRAINT "sozluk_topics_created_by_author_id_sozluk_authors_id_fk" FOREIGN KEY ("created_by_author_id") REFERENCES "public"."sozluk_authors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sozluk_topics" ADD CONSTRAINT "sozluk_topics_merged_into_topic_id_sozluk_topics_id_fk" FOREIGN KEY ("merged_into_topic_id") REFERENCES "public"."sozluk_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sozluk_authors_nick_idx" ON "sozluk_authors" USING btree ("normalized_nick");--> statement-breakpoint
CREATE INDEX "sozluk_authors_member_idx" ON "sozluk_authors" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "sozluk_channels_order_idx" ON "sozluk_channels" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sozluk_entries_topic_created_idx" ON "sozluk_entries" USING btree ("topic_id","created_at");--> statement-breakpoint
CREATE INDEX "sozluk_entries_author_created_idx" ON "sozluk_entries" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "sozluk_entries_status_idx" ON "sozluk_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sozluk_favorites_author_idx" ON "sozluk_entry_favorites" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "sozluk_reports_status_idx" ON "sozluk_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "sozluk_reports_entry_idx" ON "sozluk_reports" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "sozluk_sessions_author_idx" ON "sozluk_sessions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "sozluk_sessions_expiry_idx" ON "sozluk_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sozluk_topics_channel_idx" ON "sozluk_topics" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "sozluk_topics_last_entry_idx" ON "sozluk_topics" USING btree ("last_entry_at");--> statement-breakpoint
CREATE INDEX "sozluk_topics_normalized_idx" ON "sozluk_topics" USING btree ("normalized_title");