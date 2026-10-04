CREATE TABLE "people_overrides" (
	"slot" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "people_overrides_revision" CHECK ("people_overrides"."revision">0)
);
