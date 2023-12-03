ALTER TABLE "upvote" DROP COLUMN IF EXISTS "id";--> statement-breakpoint
ALTER TABLE "upvote" ADD CONSTRAINT "upvote_slug_userId_pk" PRIMARY KEY("slug","userId");