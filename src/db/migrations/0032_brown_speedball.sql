CREATE TABLE IF NOT EXISTS "recipe_rating" (
	"recipe_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"value" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT recipe_rating_user_id_recipe_slug_pk PRIMARY KEY("user_id","recipe_slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_rating" ADD CONSTRAINT "recipe_rating_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_rating" ADD CONSTRAINT "recipe_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
