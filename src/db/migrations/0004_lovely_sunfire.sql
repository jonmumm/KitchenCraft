ALTER TABLE "recipe" ADD CONSTRAINT "recipe_id_version_id_pk" PRIMARY KEY("id","version_id");

CREATE TABLE IF NOT EXISTS "affiliate_link_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"product_description" text,
	"product_url" text NOT NULL,
	"product_image" text,
	"product_price" numeric,
	"currency" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"version_id" integer NOT NULL,
	"affiliate_slug" text NOT NULL,
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faq" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" uuid NOT NULL,
	"version_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affiliate_link_metadata" ADD CONSTRAINT "affiliate_link_metadata_affiliate_link_id_affiliate_link_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "affiliate_link"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affiliate_link" ADD CONSTRAINT "recipe_fk" FOREIGN KEY ("recipe_id","version_id") REFERENCES "recipe"("id","version_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faq" ADD CONSTRAINT "faq_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "faq" ADD CONSTRAINT "recipe_fk" FOREIGN KEY ("recipe_id","version_id") REFERENCES "recipe"("id","version_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint