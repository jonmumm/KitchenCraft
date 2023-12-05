ALTER TABLE "profile" ALTER COLUMN "media_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "activated" boolean;