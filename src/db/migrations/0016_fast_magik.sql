ALTER TYPE "mediaType" ADD VALUE 'GENERATED';--> statement-breakpoint
ALTER TYPE "mediaType" ADD VALUE 'UPLOAD';--> statement-breakpoint
ALTER TABLE "media" RENAME COLUMN "user_id" TO "created_by";--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "content_type" SET DEFAULT 'UPLOAD';--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "created_by" DROP NOT NULL;