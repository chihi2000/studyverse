CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."institute_type" AS ENUM('faculte', 'ecole', 'institut', 'iset', 'other');--> statement-breakpoint
CREATE TYPE "public"."link_kind" AS ENUM('student_group', 'exam_archive');--> statement-breakpoint
CREATE TYPE "public"."sector" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TYPE "public"."degree" ADD VALUE 'medicine';--> statement-breakpoint
ALTER TYPE "public"."degree" ADD VALUE 'doctorat';--> statement-breakpoint
ALTER TYPE "public"."degree" ADD VALUE 'other';--> statement-breakpoint
CREATE TABLE "institute_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL,
	"kind" "link_kind" NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"platform" text,
	CONSTRAINT "institute_links_instituteId_url_unique" UNIQUE("institute_id","url")
);
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "duration_years" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "type" "institute_type";--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "governorate" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "news_url" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "elearning_url" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "student_space_url" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "equipment_notes" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "sources" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "confidence" "confidence";--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "sector" "sector" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "sources" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "institute_links" ADD CONSTRAINT "institute_links_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE cascade ON UPDATE no action;