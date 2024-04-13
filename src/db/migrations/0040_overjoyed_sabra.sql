CREATE TABLE IF NOT EXISTS "list_recipe" (
	"user_id" text NOT NULL,
	"recipe_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_recipe_list_id_recipe_id_pk" PRIMARY KEY("list_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "list" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "createdby_by_slug_unique_idx" UNIQUE("created_by","slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_recipe" ADD CONSTRAINT "list_recipe_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list_recipe" ADD CONSTRAINT "list_recipe_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "list" ADD CONSTRAINT "list_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
