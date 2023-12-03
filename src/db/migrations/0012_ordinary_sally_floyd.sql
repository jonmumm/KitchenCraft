DO $$ BEGIN
 CREATE TYPE "mediaType" AS ENUM('IMAGE', 'VIDEO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mediaUpload" (
	"id" text PRIMARY KEY NOT NULL,
	"recipeSlug" text NOT NULL,
	"userId" text NOT NULL,
	"mediaType" "mediaType" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"duration" integer,
	"uploadStatus" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mediaUpload" ADD CONSTRAINT "mediaUpload_recipeSlug_recipe_slug_fk" FOREIGN KEY ("recipeSlug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mediaUpload" ADD CONSTRAINT "mediaUpload_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
