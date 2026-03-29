CREATE TYPE "public"."appointment_type" AS ENUM('veterinary', 'grooming');--> statement-breakpoint
CREATE TYPE "public"."price_tier" AS ENUM('min', 'mid', 'hard');--> statement-breakpoint
CREATE TABLE "grooming_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"behavior_score" integer,
	"coat_type" text,
	"coat_difficulties" text,
	"behavior_notes" text,
	"estimated_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grooming_profiles_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "grooming_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"appointment_id" text,
	"groomed_by_id" text NOT NULL,
	"price_tier" "price_tier" NOT NULL,
	"final_price" numeric(10, 2),
	"before_photo_path" text,
	"after_photo_path" text,
	"findings" text[],
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "appointment_type" "appointment_type" DEFAULT 'veterinary' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "assigned_staff_id" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grooming_profiles" ADD CONSTRAINT "grooming_profiles_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grooming_sessions" ADD CONSTRAINT "grooming_sessions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grooming_sessions" ADD CONSTRAINT "grooming_sessions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grooming_sessions" ADD CONSTRAINT "grooming_sessions_groomed_by_id_staff_id_fk" FOREIGN KEY ("groomed_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grooming_sessions" ADD CONSTRAINT "grooming_sessions_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;