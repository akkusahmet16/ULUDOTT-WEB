-- Parent unique önce kurulmalıdır; Drizzle generate FK sırasını bu sürümde yanlış üretir.
ALTER TABLE "forms" ADD CONSTRAINT "form_event_identity_unique" UNIQUE("event_id","id");
--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "award_game_event_fk" FOREIGN KEY ("event_id","game_id") REFERENCES "public"."games"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalists" ADD CONSTRAINT "finalist_game_event_fk" FOREIGN KEY ("event_id","game_id") REFERENCES "public"."games"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "game_team_event_fk" FOREIGN KEY ("event_id","team_id") REFERENCES "public"."teams"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_form_event_fk" FOREIGN KEY ("event_id","form_id") REFERENCES "public"."forms"("event_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_one_active_application" ON "memberships" USING btree ("application_id") WHERE "memberships"."left_at" IS NULL;--> statement-breakpoint
