CREATE TYPE "public"."service_category" AS ENUM('cirugia', 'consulta', 'reproduccion', 'cardiologia', 'peluqueria', 'vacunacion', 'petshop', 'otro');--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "service_category" NOT NULL,
	"default_duration_minutes" integer NOT NULL,
	"block_duration_minutes" integer,
	"base_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "service_id" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;