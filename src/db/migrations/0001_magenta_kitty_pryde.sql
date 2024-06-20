CREATE TABLE IF NOT EXISTS "user_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_id_by_list_id_unique_idx" UNIQUE("user_id","list_id")
);
--> statement-breakpoint
DROP TABLE "comment";--> statement-breakpoint
DROP TABLE "account";--> statement-breakpoint
ALTER TABLE "list" DROP CONSTRAINT "createdby_by_slug_unique_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tags_gin_idx";--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "source_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recipe" ALTER COLUMN "tokens" DROP DEFAULT;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_list" ADD CONSTRAINT "user_list_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_list" ADD CONSTRAINT "user_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_gin_idx" ON "recipe" USING btree ("tags");--> statement-breakpoint
ALTER TABLE "recipe_rating" DROP CONSTRAINT recipe_rating_user_id_recipe_slug_pk;
--> statement-breakpoint
ALTER TABLE "recipe_rating" ADD CONSTRAINT recipe_rating_user_id_recipe_slug_pk PRIMARY KEY(user_id,recipe_slug);--> statement-breakpoint
ALTER TABLE "list_recipe" DROP CONSTRAINT list_recipe_list_id_recipe_id_pk;
--> statement-breakpoint
ALTER TABLE "list_recipe" ADD CONSTRAINT list_recipe_list_id_recipe_id_pk PRIMARY KEY(list_id,recipe_id);--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" DROP CONSTRAINT amazon_affiliate_product_recipe_slug_asin_pk;
--> statement-breakpoint
ALTER TABLE "amazon_affiliate_product" ADD CONSTRAINT amazon_affiliate_product_recipe_slug_asin_pk PRIMARY KEY(recipe_slug,asin);--> statement-breakpoint
ALTER TABLE "list" ADD CONSTRAINT "createdby_by_slug_unique_idx" UNIQUE("created_by","slug");