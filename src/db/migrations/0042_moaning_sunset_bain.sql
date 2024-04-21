DO $$ BEGIN
 CREATE TYPE "preference_key_enum" AS ENUM('dietary_restrictions', 'cuisine_preferences', 'cooking_frequency', 'cooking_equipment', 'ingredient_preference', 'time_availability', 'meal_type_preferences', 'allergy_info');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
