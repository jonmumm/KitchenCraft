--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "source_type" DROP DEFAULT;
ALTER TABLE "media" ALTER COLUMN "source_type" SET DATA TYPE "sourceType" USING 'UPLOAD';--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "source_type" SET DEFAULT 'UPLOAD';