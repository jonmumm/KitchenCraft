ALTER TABLE "recipe" DROP CONSTRAINT "recipe_createdBy_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recipe" ALTER COLUMN "createdBy" SET NOT NULL;