ALTER TABLE "faq" RENAME COLUMN "recipe_id" TO "recipe_slug";--> statement-breakpoint
ALTER TABLE "faq" DROP CONSTRAINT "recipe_fk";
--> statement-breakpoint
ALTER TABLE "faq" ALTER COLUMN "recipe_slug" SET DATA TYPE text;