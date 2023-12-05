DROP INDEX IF EXISTS "tags_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_gin_idx" ON "recipe" ("tags");