CREATE TABLE IF NOT EXISTS "user_recipe" (
	"user_id" text NOT NULL,
	"recipe_slug" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_recipe_user_id_recipe_slug_pk" PRIMARY KEY("user_id","recipe_slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_recipe" ADD CONSTRAINT "user_recipe_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_recipe" ADD CONSTRAINT "user_recipe_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
