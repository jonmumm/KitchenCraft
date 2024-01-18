CREATE TABLE IF NOT EXISTS "recipe_comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" text NOT NULL,
	"user_id" text NOT NULL,
	"mediaIds" jsonb,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"edit_history" jsonb NOT NULL
);
--> statement-breakpoint