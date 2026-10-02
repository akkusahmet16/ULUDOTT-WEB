ALTER TABLE "game_credits" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_credits" ADD COLUMN "consent_token_hash" text;--> statement-breakpoint
ALTER TABLE "game_credits" ADD COLUMN "consent_token_encrypted" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "editorial_team_name" text;--> statement-breakpoint
ALTER TABLE "game_credits" ADD CONSTRAINT "game_credits_consent_token_hash_unique" UNIQUE("consent_token_hash");--> statement-breakpoint
ALTER TABLE "game_credits" ADD CONSTRAINT "game_credit_application_unique" UNIQUE("game_id","application_id");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "game_credits" ADD CONSTRAINT "game_credit_revision" CHECK ("game_credits"."revision">0);