CREATE TABLE IF NOT EXISTS "upvote" (
	"id" text PRIMARY KEY NOT NULL,
	"recipeId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvote" ADD CONSTRAINT "upvote_recipeId_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvote" ADD CONSTRAINT "upvote_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
