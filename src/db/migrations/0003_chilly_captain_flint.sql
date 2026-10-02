CREATE TABLE "content_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	CONSTRAINT "content_redirect_slug_unique" UNIQUE("content_type","old_slug"),
	CONSTRAINT "content_redirect_type" CHECK ("content_redirects"."content_type" IN ('event','announcement'))
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "excerpt" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "seo" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "cta_url" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "cta_label" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "excerpt" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "organizer" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location_type" text DEFAULT 'physical' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "media_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "form_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;