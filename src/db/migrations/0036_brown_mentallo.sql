DO $$ BEGIN
 CREATE TYPE "affiliate" AS ENUM('Amazon', 'Etsy', 'Instacart', 'Target');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_product" (
	"name" text NOT NULL,
	"type" "type" NOT NULL,
	"affiliate" "affiliate" NOT NULL,
	"asin" text NOT NULL,
	"image_url" text NOT NULL,
	"image_width" integer NOT NULL,
	"image_height" integer NOT NULL,
	"blur_data_url" text NOT NULL,
	"curated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "affiliate_unique_id_idx" UNIQUE("affiliate","asin")
);
