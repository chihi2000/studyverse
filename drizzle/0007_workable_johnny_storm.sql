CREATE TYPE "public"."equipment_category" AS ENUM('clothing', 'tools', 'supplies', 'software', 'books', 'other');--> statement-breakpoint
ALTER TABLE "equipment_items" ALTER COLUMN "program_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "institute_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "level_id" uuid;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "category" "equipment_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "import_key" text;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_items_institute_id_index" ON "equipment_items" USING btree ("institute_id");--> statement-breakpoint
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_importKey_unique" UNIQUE("import_key");