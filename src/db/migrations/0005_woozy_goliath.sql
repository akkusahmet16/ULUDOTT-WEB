ALTER TABLE "link_groups" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "link_groups" ADD CONSTRAINT "link_group_position_unique" UNIQUE("position");--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "link_group_link_position_unique" UNIQUE("group_id","position");--> statement-breakpoint
ALTER TABLE "link_groups" ADD CONSTRAINT "link_group_revision" CHECK ("link_groups"."revision">0);--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "link_revision" CHECK ("links"."revision">0);