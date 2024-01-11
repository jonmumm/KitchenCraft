ALTER TABLE "user_feature_log" DROP CONSTRAINT "user_feature_log_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_feature_state" DROP CONSTRAINT "user_feature_state_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_feature_usage" DROP CONSTRAINT "user_feature_usage_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_feature_log" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feature_state" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feature_usage" ALTER COLUMN "user_id" DROP NOT NULL;