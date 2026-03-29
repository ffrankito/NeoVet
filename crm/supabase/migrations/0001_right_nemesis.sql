CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"imported_from_gvet" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"breed" text,
	"date_of_birth" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "availability_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "business_context" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "urgency_escalations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "contacts" CASCADE;--> statement-breakpoint
DROP TABLE "conversations" CASCADE;--> statement-breakpoint
DROP TABLE "messages" CASCADE;--> statement-breakpoint
DROP TABLE "availability_rules" CASCADE;--> statement-breakpoint
DROP TABLE "business_context" CASCADE;--> statement-breakpoint
DROP TABLE "urgency_escalations" CASCADE;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."appointment_status";--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DATA TYPE "public"."appointment_status" USING "status"::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "patient_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "contact_id";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "conversation_id";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "pet_name";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "pet_species";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "reminder_sent_at";--> statement-breakpoint
DROP TYPE "public"."conversation_status";--> statement-breakpoint
DROP TYPE "public"."urgency_level";--> statement-breakpoint
DROP TYPE "public"."message_type";--> statement-breakpoint
DROP TYPE "public"."sender_type";--> statement-breakpoint
DROP TYPE "public"."business_context_category";--> statement-breakpoint
DROP TYPE "public"."escalation_action";