DO $$ BEGIN
 CREATE TYPE "feature_id" AS ENUM('push:trends', 'push:products', 'push:top_recipes', 'push:tips_and_tricks', 'push:awards', 'email:trends', 'email:products', 'email:top_recipes', 'email:tips_and_tricks', 'craft:instant-recipe', 'craft:suggested-recipes', 'recipe:create', 'recipe:prompt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feature_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature_id" "feature_id" NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_feature_state" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature_id" "feature_id" NOT NULL,
	"enabled" boolean DEFAULT true,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
-- Drop the existing constraint
ALTER TABLE "user_feature_usage" DROP CONSTRAINT "user_feature_usage_feature_id_feature_id_fk";

-- Convert feature_id to text
ALTER TABLE "user_feature_usage" ALTER COLUMN "feature_id" TYPE text USING feature_id::text;

-- Convert feature_id from text to the custom enum type
ALTER TABLE "user_feature_usage" ALTER COLUMN "feature_id" TYPE feature_id USING feature_id::feature_id;

DO $$ BEGIN
 ALTER TABLE "user_feature_log" ADD CONSTRAINT "user_feature_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_feature_state" ADD CONSTRAINT "user_feature_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
