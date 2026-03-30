CREATE TYPE "public"."consultation_type" AS ENUM('clinica', 'virtual', 'domicilio');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('laboratorio', 'radiografia', 'ecografia', 'foto', 'otro');--> statement-breakpoint
CREATE TABLE "complementary_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"study_type" text NOT NULL,
	"content" text NOT NULL,
	"photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "consultation_type" "consultation_type";--> statement-breakpoint
ALTER TABLE "treatment_items" ADD COLUMN "medication" text;--> statement-breakpoint
ALTER TABLE "treatment_items" ADD COLUMN "dose" text;--> statement-breakpoint
ALTER TABLE "treatment_items" ADD COLUMN "frequency" text;--> statement-breakpoint
ALTER TABLE "treatment_items" ADD COLUMN "duration_days" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "category" "document_category";--> statement-breakpoint
ALTER TABLE "complementary_methods" ADD CONSTRAINT "complementary_methods_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;