ALTER TABLE "games" ADD COLUMN "slug_locked" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "games" SET "slug_locked"=true WHERE "published_at" IS NOT NULL AND "slug" IS NOT NULL;
