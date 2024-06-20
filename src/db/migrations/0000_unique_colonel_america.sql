-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "public"."affiliate" AS ENUM('Amazon', 'Etsy', 'Instacart', 'Target');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."feature_id" AS ENUM('push:trends', 'push:products', 'push:top_recipes', 'push:tips_and_tricks', 'push:awards', 'email:trends', 'email:products', 'email:top_recipes', 'email:tips_and_tricks', 'craft:instant-recipe', 'craft:suggested-recipes', 'recipe:create', 'recipe:prompt', 'email:awards');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."mediaType" AS ENUM('IMAGE', 'VIDEO', 'GENERATED', 'UPLOAD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."preference_key_enum" AS ENUM('dietary_restrictions', 'cuisine_preferences', 'cooking_frequency', 'cooking_equipment', 'ingredient_preference', 'time_availability', 'meal_type_preferences', 'allergy_info', 'skill_level', 'dietaryRestrictions', 'cuisinePreferences', 'cookingFrequency', 'cookingEquipment', 'ingredientPreference', 'timeAvailability', 'skillLevel');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sourceType" AS ENUM('GENERATED', 'UPLOAD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."type" AS ENUM('ingredient', 'book', 'equipment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feature_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text,
	"feature_id" "feature_id" NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text,
	"media_type" "mediaType" NOT NULL,
	"content_type" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"filename" text,
	"duration" integer,
	"blurDataURL" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"source_type" "sourceType" DEFAULT 'UPLOAD' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"profile_slug" text PRIMARY KEY NOT NULL,
	"activated" boolean DEFAULT false NOT NULL,
	"media_id" uuid,
	"serial_num" bigserial NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"created_at" timestamp DEFAULT now(),
	"image" text,
	"stripe_customer_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_member" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"subscription_id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "subscription_member_subscription_id_user_id_unique" UNIQUE("subscription_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature_name" text NOT NULL,
	"description" text,
	"quota_limit" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feature_usage" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text,
	"feature_id" "feature_id" NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"usage_count" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faq" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_slug" text NOT NULL,
	"version_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe_comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"mediaIds" jsonb,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"edit_history" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_product" (
	"name" text NOT NULL,
	"type" "type" NOT NULL,
	"affiliate" "affiliate" NOT NULL,
	"affiliate_unique_id" text NOT NULL,
	"image_url" text NOT NULL,
	"image_width" integer NOT NULL,
	"image_height" integer NOT NULL,
	"blur_data_url" text NOT NULL,
	"curated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "affiliate_unique_id_idx" UNIQUE("affiliate","affiliate_unique_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"belongsTo" text NOT NULL,
	"subscription" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"edit_history" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"preference_id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"preference_key" "preference_key_enum" NOT NULL,
	"preference_value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_and_preference_key_idx" UNIQUE("user_id","preference_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "createdby_by_slug_unique_idx" UNIQUE("slug","created_by")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_media" (
	"recipe_slug" text NOT NULL,
	"media_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "generated_media_recipe_slug_media_id_pk" PRIMARY KEY("recipe_slug","media_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationtoken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "upvote" (
	"recipe_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upvote_recipe_id_user_id_pk" PRIMARY KEY("recipe_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feature_state" (
	"user_id" text NOT NULL,
	"feature_id" "feature_id" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	CONSTRAINT "user_feature_state_user_id_feature_id_pk" PRIMARY KEY("user_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe_rating" (
	"recipe_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"value" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_rating_user_id_recipe_slug_pk" PRIMARY KEY("recipe_slug","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe_media" (
	"recipe_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_media_recipe_id_media_id_pk" PRIMARY KEY("recipe_id","media_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "list_recipe" (
	"user_id" text NOT NULL,
	"recipe_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_recipe_list_id_recipe_id_pk" PRIMARY KEY("recipe_id","list_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "amazon_affiliate_product" (
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"blur_data_url" text,
	"image_width" integer NOT NULL,
	"image_height" integer NOT NULL,
	"asin" text NOT NULL,
	"type" "type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"recipe_slug" text NOT NULL,
	CONSTRAINT "amazon_affiliate_product_recipe_slug_asin_pk" PRIMARY KEY("asin","recipe_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provideraccountid_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"version_id" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"yield" text NOT NULL,
	"createdBy" text NOT NULL,
	"tags" jsonb NOT NULL,
	"activeTime" text NOT NULL,
	"cookTime" text NOT NULL,
	"totalTime" text NOT NULL,
	"ingredients" jsonb NOT NULL,
	"instructions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"prompt" text NOT NULL,
	"tokens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "recipe_id_version_id_pk" PRIMARY KEY("id","version_id"),
	CONSTRAINT "recipe_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile" ADD CONSTRAINT "profile_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_member" ADD CONSTRAINT "subscription_member_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_member" ADD CONSTRAINT "subscription_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faq" ADD CONSTRAINT "faq_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "public"."recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list" ADD CONSTRAINT "list_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "public"."recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "upvote" ADD CONSTRAINT "upvote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_rating" ADD CONSTRAINT "recipe_rating_recipe_slug_recipe_slug_fk" FOREIGN KEY ("recipe_slug") REFERENCES "public"."recipe"("slug") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_rating" ADD CONSTRAINT "recipe_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_recipe" ADD CONSTRAINT "list_recipe_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_recipe" ADD CONSTRAINT "list_recipe_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_gin_idx" ON "recipe" USING btree ("tags" jsonb_ops);
*/