ALTER TABLE "recipe" ADD COLUMN "tokens" jsonb NOT NULL DEFAULT '[]'::jsonb;
