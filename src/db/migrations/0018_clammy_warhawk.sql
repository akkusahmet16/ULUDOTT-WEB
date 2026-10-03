ALTER TABLE "wallet_passes" ADD COLUMN "synced_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD COLUMN "last_error_code" text;--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_synced_revision" CHECK ("wallet_passes"."synced_revision">=0 AND "wallet_passes"."synced_revision"<="wallet_passes"."revision");