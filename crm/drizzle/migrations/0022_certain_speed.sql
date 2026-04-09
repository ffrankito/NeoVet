CREATE TABLE "procedure_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"procedure_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "procedures" DROP CONSTRAINT "procedures_surgeon_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "procedures" DROP CONSTRAINT "procedures_anesthesiologist_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "procedure_staff" ADD CONSTRAINT "procedure_staff_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_staff" ADD CONSTRAINT "procedure_staff_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" DROP COLUMN "surgeon_id";--> statement-breakpoint
ALTER TABLE "procedures" DROP COLUMN "anesthesiologist_id";