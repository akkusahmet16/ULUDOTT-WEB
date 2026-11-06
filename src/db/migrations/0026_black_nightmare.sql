CREATE TABLE "fanzin_articles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"issue_id" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"category" text NOT NULL,
	"start_page" integer NOT NULL,
	"page_span" integer DEFAULT 1 NOT NULL,
	"excerpt" text NOT NULL,
	"highlight_quote" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fanzin_issues" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"issue_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"subtitle" text,
	"season" varchar(32) NOT NULL,
	"year" integer NOT NULL,
	"description" text NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"pdf_asset_id" varchar(64),
	"pdf_url" text NOT NULL,
	"pdf_file_size" varchar(32),
	"cover_asset_id" varchar(64),
	"cover_image_url" text,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fanzin_issues_issue_number_unique" UNIQUE("issue_number"),
	CONSTRAINT "fanzin_issues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fanzin_pages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"issue_id" varchar(64) NOT NULL,
	"page_number" integer NOT NULL,
	"page_type" varchar(32) NOT NULL,
	"title" text,
	"subtitle" text,
	"content_html" text,
	"author" text,
	"quote" text,
	"items_json" jsonb,
	"gallery_images_json" jsonb,
	"page_image_asset_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(255) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"referer_host" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fanzin_articles" ADD CONSTRAINT "fanzin_articles_issue_id_fanzin_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."fanzin_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fanzin_pages" ADD CONSTRAINT "fanzin_pages_issue_id_fanzin_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."fanzin_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_page_views_path_idx" ON "site_page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "site_page_views_created_at_idx" ON "site_page_views" USING btree ("created_at");