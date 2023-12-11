ALTER TABLE "amazon_affiliate_product" DROP CONSTRAINT "amazon_affiliate_product_asin_recipe_slug_pk";--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ALTER COLUMN "image_width" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ALTER COLUMN "image_height" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ADD CONSTRAINT "amazon_affiliate_product_recipe_slug_asin_pk" PRIMARY KEY("recipe_slug","asin");