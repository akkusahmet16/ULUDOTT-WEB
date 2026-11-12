CREATE TABLE "site_analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"event_name" varchar(128) NOT NULL,
	"path" varchar(255) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_page_views" ADD COLUMN "device_type" varchar(32);--> statement-breakpoint
ALTER TABLE "site_page_views" ADD COLUMN "browser" varchar(64);--> statement-breakpoint
ALTER TABLE "site_page_views" ADD COLUMN "os" varchar(64);--> statement-breakpoint
ALTER TABLE "site_page_views" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
CREATE INDEX "site_analytics_events_type_idx" ON "site_analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "site_analytics_events_created_at_idx" ON "site_analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_analytics_events_path_idx" ON "site_analytics_events" USING btree ("path");