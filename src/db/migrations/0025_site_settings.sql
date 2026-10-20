CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "site_settings_revision" CHECK ("site_settings"."revision">0)
);
