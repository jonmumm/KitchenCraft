ALTER TABLE "mediaUpload" ALTER COLUMN "id" SET DATA TYPE uuid USING (gen_random_uuid());--> statement-breakpoint
ALTER TABLE "mediaUpload" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();