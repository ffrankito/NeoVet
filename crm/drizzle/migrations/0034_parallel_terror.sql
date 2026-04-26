CREATE TYPE "public"."follow_up_status" AS ENUM('pending', 'done', 'dismissed');--> statement-breakpoint
ALTER TABLE "follow_ups" ADD COLUMN "status" "follow_up_status" DEFAULT 'pending' NOT NULL;