ALTER TABLE "mediaUpload" RENAME TO "media";--> statement-breakpoint
ALTER TABLE "media" RENAME COLUMN "recipeSlug" TO "recipe_slug";--> statement-breakpoint
ALTER TABLE "media" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "media" RENAME COLUMN "mediaType" TO "media_type";--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "mediaUpload_recipeSlug_recipe_slug_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "mediaUpload_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe" ADD COLUMN "yield" text NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "filename" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
