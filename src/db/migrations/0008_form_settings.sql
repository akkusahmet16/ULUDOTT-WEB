ALTER TABLE "forms" DROP CONSTRAINT "form_status";--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "draft_version_id" uuid;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "current_version_id" uuid;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "form_draft_version_fk" FOREIGN KEY ("id","draft_version_id") REFERENCES "public"."form_versions"("form_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "form_current_version_fk" FOREIGN KEY ("id","current_version_id") REFERENCES "public"."form_versions"("form_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "form_status" CHECK ("forms"."status" IN ('draft','published','paused','closed','archived'));