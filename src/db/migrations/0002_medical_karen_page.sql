ALTER TABLE "admin_sessions" ADD COLUMN "absolute_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "last_totp_counter" bigint;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_session_absolute" CHECK ("admin_sessions"."absolute_expires_at" >= "admin_sessions"."expires_at");--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admin_failed_attempts" CHECK ("admins"."failed_attempts">=0);