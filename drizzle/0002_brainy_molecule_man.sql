ALTER TABLE "posts" ALTER COLUMN "institute_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "university_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "import_key" text;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_university_id_published_at_index" ON "posts" USING btree ("university_id","published_at");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_importKey_unique" UNIQUE("import_key");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_narrow_scope_needs_institute" CHECK ("posts"."institute_id" is not null or ("posts"."program_id" is null and "posts"."level_id" is null and "posts"."group_id" is null));