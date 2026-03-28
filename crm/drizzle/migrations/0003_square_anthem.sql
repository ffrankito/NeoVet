ALTER TABLE "clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "gvet_id" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "neutered" boolean;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "weight_kg" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "microchip" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "gvet_history_number" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "gvet_id" text;