CREATE TABLE "community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"email" text NOT NULL,
	"faculty_department" text,
	"registration_date" text,
	"period" text DEFAULT '2026 - 2027' NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_members_email_unique" UNIQUE("email"),
	CONSTRAINT "community_member_status" CHECK ("community_members"."status" IN ('active', 'revoked'))
);
--> statement-breakpoint
CREATE TABLE "member_card_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone,
	CONSTRAINT "member_card_grants_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "member_card_grant_status" CHECK ("member_card_grants"."status" IN ('active', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "member_card_grants" ADD CONSTRAINT "member_card_grants_member_id_community_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."community_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_members_email_idx" ON "community_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "community_members_normalized_name_idx" ON "community_members" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "member_card_grants_token_idx" ON "member_card_grants" USING btree ("token_hash");