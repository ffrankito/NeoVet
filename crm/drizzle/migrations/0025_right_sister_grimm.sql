ALTER TABLE "procedures" ADD COLUMN "asa_score" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "pre_weight_kg" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "pre_temperature" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "pre_heart_rate" numeric(5, 0);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "pre_respiratory_rate" numeric(4, 0);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "post_weight_kg" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "post_temperature" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "post_heart_rate" numeric(5, 0);--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "post_respiratory_rate" numeric(4, 0);