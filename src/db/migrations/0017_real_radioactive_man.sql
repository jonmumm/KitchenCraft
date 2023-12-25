ALTER TABLE "media" ALTER COLUMN "content_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "source_type" text DEFAULT 'UPLOAD' NOT NULL;