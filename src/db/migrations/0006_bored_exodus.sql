ALTER TABLE "recipe" RENAME COLUMN "id" TO "slug";--> statement-breakpoint
ALTER TABLE "upvote" RENAME COLUMN "recipeId" TO "slug";--> statement-breakpoint
ALTER TABLE "upvote" DROP CONSTRAINT "upvote_recipeId_recipe_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvote" ADD CONSTRAINT "upvote_slug_recipe_slug_fk" FOREIGN KEY ("slug") REFERENCES "recipe"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
