CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"belongsTo" text NOT NULL,
	"subscription" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
