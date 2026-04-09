CREATE TABLE "hospitalizations" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"consultation_id" text,
	"admitted_at" timestamp with time zone NOT NULL,
	"discharged_at" timestamp with time zone,
	"admitted_by_id" text,
	"discharged_by_id" text,
	"reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitalization_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"hospitalization_id" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"recorded_by_id" text,
	"weight_kg" numeric(5, 2),
	"temperature" numeric(4, 1),
	"heart_rate" numeric(5, 0),
	"respiratory_rate" numeric(4, 0),
	"feeding" text,
	"hydration" text,
	"medication" text,
	"urine_output" text,
	"feces_output" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"hospitalization_id" text,
	"surgeon_id" text,
	"anesthesiologist_id" text,
	"procedure_date" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"type" text,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procedure_supplies" (
	"id" text PRIMARY KEY NOT NULL,
	"procedure_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"body_template" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text,
	"patient_id" text NOT NULL,
	"client_id" text,
	"procedure_id" text,
	"hospitalization_id" text,
	"storage_path" text,
	"custom_fields" jsonb,
	"generated_at" timestamp with time zone NOT NULL,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text NOT NULL,
	"paid_at" timestamp with time zone,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "dni" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "coat_color" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "license_number" text;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD COLUMN "procedure_id" text;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_admitted_by_id_staff_id_fk" FOREIGN KEY ("admitted_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_discharged_by_id_staff_id_fk" FOREIGN KEY ("discharged_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalization_observations" ADD CONSTRAINT "hospitalization_observations_hospitalization_id_hospitalizations_id_fk" FOREIGN KEY ("hospitalization_id") REFERENCES "public"."hospitalizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalization_observations" ADD CONSTRAINT "hospitalization_observations_recorded_by_id_staff_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_hospitalization_id_hospitalizations_id_fk" FOREIGN KEY ("hospitalization_id") REFERENCES "public"."hospitalizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_surgeon_id_staff_id_fk" FOREIGN KEY ("surgeon_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_anesthesiologist_id_staff_id_fk" FOREIGN KEY ("anesthesiologist_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_supplies" ADD CONSTRAINT "procedure_supplies_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_supplies" ADD CONSTRAINT "procedure_supplies_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_template_id_consent_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."consent_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_hospitalization_id_hospitalizations_id_fk" FOREIGN KEY ("hospitalization_id") REFERENCES "public"."hospitalizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE set null ON UPDATE no action;