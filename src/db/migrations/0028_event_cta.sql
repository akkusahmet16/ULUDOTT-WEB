ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "cta_url" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "cta_label" text;
