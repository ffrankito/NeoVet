CREATE UNIQUE INDEX "clients_phone_unique_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_sessions_one_open_idx" ON "cash_sessions" USING btree ((("closed_at" IS NULL))) WHERE "cash_sessions"."closed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "hospitalizations_one_active_per_patient_idx" ON "hospitalizations" USING btree ("patient_id") WHERE "hospitalizations"."discharged_at" IS NULL;