ALTER TABLE "appointments" ADD COLUMN "is_walk_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "is_urgent" boolean DEFAULT false NOT NULL;