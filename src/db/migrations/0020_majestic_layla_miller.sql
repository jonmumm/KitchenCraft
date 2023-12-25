ALTER TABLE "generated_media" ALTER COLUMN "recipe_slug" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "generated_media" ALTER COLUMN "recipe_slug" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
