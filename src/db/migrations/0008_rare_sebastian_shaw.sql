ALTER TABLE "upvote" DROP CONSTRAINT "upvote_slug_recipe_slug_fk";
--> statement-breakpoint
ALTER TABLE "upvote" ALTER COLUMN "id" SET DATA TYPE uuid USING (gen_random_uuid());--> statement-breakpoint
ALTER TABLE "upvote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "upvote" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvote" ADD CONSTRAINT "upvote_slug_recipe_slug_fk" FOREIGN KEY ("slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
