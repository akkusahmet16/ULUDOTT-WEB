ALTER TABLE "sozluk_authors" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sozluk_authors" ADD COLUMN "google_sub" text;--> statement-breakpoint
ALTER TABLE "sozluk_authors" ADD CONSTRAINT "sozluk_authors_google_sub_unique" UNIQUE("google_sub");