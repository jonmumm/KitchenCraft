CREATE TABLE IF NOT EXISTS "recipe_media" (
	"recipe_slug" text NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_recipe_slug_recipe_slug_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "recipe_slug";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
