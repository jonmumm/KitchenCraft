ALTER TABLE "amazon_affiliate_product" DROP CONSTRAINT "amazon_affiliate_product_recipe_slug_recipe_slug_fk";
--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ALTER COLUMN "recipe_slug" DROP NOT NULL;