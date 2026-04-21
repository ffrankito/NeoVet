CREATE TYPE "public"."retorno_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."retorno_task_type" AS ENUM('sacar_sangre', 'ecografia', 'curacion', 'aplicar_medicacion', 'radiografia', 'control_signos_vitales', 'otro');--> statement-breakpoint
CREATE TABLE "retorno_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"appointment_id" text NOT NULL,
	"task_type" "retorno_task_type" NOT NULL,
	"notes" text,
	"status" "retorno_status" DEFAULT 'pending' NOT NULL,
	"created_by_staff_id" text NOT NULL,
	"assigned_to_staff_id" text,
	"performed_by_staff_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retorno_queue_state_machine" CHECK (
        (status = 'pending' AND started_at IS NULL AND completed_at IS NULL AND performed_by_staff_id IS NULL)
        OR (status = 'in_progress' AND started_at IS NOT NULL AND completed_at IS NULL AND performed_by_staff_id IS NOT NULL)
        OR (status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL AND performed_by_staff_id IS NOT NULL)
      )
);
--> statement-breakpoint
ALTER TABLE "retorno_queue" ADD CONSTRAINT "retorno_queue_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retorno_queue" ADD CONSTRAINT "retorno_queue_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retorno_queue" ADD CONSTRAINT "retorno_queue_created_by_staff_id_staff_id_fk" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retorno_queue" ADD CONSTRAINT "retorno_queue_assigned_to_staff_id_staff_id_fk" FOREIGN KEY ("assigned_to_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retorno_queue" ADD CONSTRAINT "retorno_queue_performed_by_staff_id_staff_id_fk" FOREIGN KEY ("performed_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "retorno_queue_pending_idx" ON "retorno_queue" USING btree ("status","created_at") WHERE status <> 'completed';