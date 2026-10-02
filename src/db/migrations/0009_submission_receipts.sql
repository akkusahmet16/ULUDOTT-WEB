ALTER TABLE "submission_status_history" DROP CONSTRAINT "history_status";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submission_status";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "expires_at" timestamp with time zone DEFAULT now() + interval '180 days' NOT NULL;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
CREATE INDEX "submissions_expiry_idx" ON "submissions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "submission_status_history" ADD CONSTRAINT "history_status" CHECK ("submission_status_history"."status" IN ('received','pending','approved','rejected','withdrawn','waitlisted'));--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_revision" CHECK ("submissions"."revision">0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_expiry" CHECK ("submissions"."expires_at">"submissions"."created_at");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_status" CHECK ("submissions"."status" IN ('received','pending','approved','rejected','withdrawn','waitlisted'));