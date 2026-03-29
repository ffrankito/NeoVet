CREATE TYPE "public"."treatment_status" AS ENUM('pending', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "treatment_items" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"description" text NOT NULL,
	"status" "treatment_status" DEFAULT 'pending' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "treatment_items" ADD CONSTRAINT "treatment_items_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;