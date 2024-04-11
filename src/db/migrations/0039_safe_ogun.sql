ALTER TABLE "user_recipe" DROP CONSTRAINT "user_recipe_recipe_slug_recipe_slug_fk";
--> statement-breakpoint
ALTER TABLE "user_recipe" DROP CONSTRAINT "user_recipe_user_id_recipe_slug_pk";--> statement-breakpoint
ALTER TABLE "user_recipe" ADD COLUMN "recipe_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_recipe" ADD CONSTRAINT "user_recipe_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id");--> statement-breakpoint
ALTER TABLE "user_recipe" DROP COLUMN IF EXISTS "recipe_slug";