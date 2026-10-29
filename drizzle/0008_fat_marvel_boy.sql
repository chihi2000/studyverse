CREATE TYPE "public"."applicant_position" AS ENUM('student', 'class_rep', 'club_member', 'other');--> statement-breakpoint
CREATE TABLE "ambassador_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"institute_id" uuid NOT NULL,
	"study_program" text NOT NULL,
	"position" "applicant_position" NOT NULL,
	"motivation" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ambassador_applications" ADD CONSTRAINT "ambassador_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassador_applications" ADD CONSTRAINT "ambassador_applications_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassador_applications" ADD CONSTRAINT "ambassador_applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ambassador_applications_status_created_at_index" ON "ambassador_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ambassador_applications_user_id_index" ON "ambassador_applications" USING btree ("user_id");