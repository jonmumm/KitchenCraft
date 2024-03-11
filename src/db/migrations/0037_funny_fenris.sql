ALTER TABLE "affiliate_product" RENAME COLUMN "asin" TO "affiliate_unique_id";--> statement-breakpoint
ALTER TABLE "affiliate_product" DROP CONSTRAINT "affiliate_unique_id_idx";--> statement-breakpoint
ALTER TABLE "affiliate_product" ALTER COLUMN "blur_data_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate_product" ADD CONSTRAINT "affiliate_unique_id_idx" UNIQUE("affiliate","affiliate_unique_id");