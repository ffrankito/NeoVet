CREATE TABLE "vaccinations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"consultation_id" text,
	"vaccine_name" text NOT NULL,
	"applied_at" text NOT NULL,
	"next_due_at" text,
	"batch_number" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deworming_records" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"consultation_id" text,
	"product" text NOT NULL,
	"applied_at" text NOT NULL,
	"next_due_at" text,
	"dose" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deworming_records" ADD CONSTRAINT "deworming_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deworming_records" ADD CONSTRAINT "deworming_records_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;