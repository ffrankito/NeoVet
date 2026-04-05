ALTER TYPE "public"."appointment_status" ADD VALUE 'no_show';--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "cancellation_reason" text;
