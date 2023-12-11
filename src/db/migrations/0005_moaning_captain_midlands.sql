DO $$ BEGIN
 CREATE TYPE "type" AS ENUM('ingredient', 'book', 'equipment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "amazon_affiliate_product" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"blur_data_url" text,
	"image_width" integer,
	"image_height" integer,
	"asin" text NOT NULL,
	"type" "type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"recipe_slug" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "amazon_affiliate_product" ADD CONSTRAINT "amazon_affiliate_product_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
