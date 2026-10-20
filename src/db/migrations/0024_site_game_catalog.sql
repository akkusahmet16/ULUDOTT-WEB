CREATE TABLE "site_game_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "site_game_entries_revision" CHECK ("site_game_entries"."revision">0)
);
