CREATE TABLE "retention_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted" integer NOT NULL,
	"anonymized" integer NOT NULL,
	"pending_revocations" integer NOT NULL,
	CONSTRAINT "retention_counts" CHECK ("retention_runs"."deleted">=0 AND "retention_runs"."anonymized">=0 AND "retention_runs"."pending_revocations">=0)
);
--> statement-breakpoint
CREATE INDEX "retention_runs_time_idx" ON "retention_runs" USING btree ("completed_at");