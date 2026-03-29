CREATE TABLE "consultations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"appointment_id" text,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"weight_kg" numeric(5, 2),
	"temperature" numeric(4, 1),
	"heart_rate" numeric(5, 0),
	"respiratory_rate" numeric(4, 0),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;