CREATE TABLE "event_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"verified_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "gallery_event_position" UNIQUE("event_id","position"),
	CONSTRAINT "gallery_position" CHECK ("event_gallery"."position" between 0 and 49),
	CONSTRAINT "gallery_revision" CHECK ("event_gallery"."revision">0)
);
--> statement-breakpoint
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;