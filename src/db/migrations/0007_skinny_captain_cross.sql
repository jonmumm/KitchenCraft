ALTER TABLE "amazon_affiliate_product" ALTER COLUMN "recipe_slug" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "amazon_affiliate_product" ADD CONSTRAINT "amazon_affiliate_product_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ADD CONSTRAINT "amazon_affiliate_product_asin_recipe_slug_pk" PRIMARY KEY("asin","recipe_slug");