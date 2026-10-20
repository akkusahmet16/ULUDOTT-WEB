CREATE TABLE "submission_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"field_key" uuid NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_files_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "submission_file_field_unique" UNIQUE("submission_id","field_key"),
	CONSTRAINT "submission_file_size" CHECK ("submission_files"."byte_size">0 AND "submission_files"."byte_size"<=5242880)
);
--> statement-breakpoint
ALTER TABLE "form_fields" DROP CONSTRAINT "form_field_type";--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submission_files_submission_idx" ON "submission_files" USING btree ("submission_id");--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_field_type" CHECK ("form_fields"."type" IN ('short_text','long_text','email','phone','number','date','file','single_choice','multiple_choice','dropdown','checkbox','radio','rating','info','section','consent'));