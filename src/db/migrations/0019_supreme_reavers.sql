CREATE TABLE IF NOT EXISTS "generated_media" (
	"recipe_slug" uuid,
	"media_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT generated_media_recipe_slug_media_id_pk PRIMARY KEY("recipe_slug","media_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
