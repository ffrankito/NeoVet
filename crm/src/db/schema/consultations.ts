import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { appointments } from "./appointments";

export const consultations = pgTable("consultations", {
  id: text("id").primaryKey(),

  // Relations
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id")
    .references(() => appointments.id, { onDelete: "set null" }),

  // SOAP fields — all optional
  subjective:  text("subjective"),   // S: what the owner reports
  objective:   text("objective"),    // O: what the vet observes / measures
  assessment:  text("assessment"),   // A: diagnosis
  plan:        text("plan"),         // P: next steps

  // Vitals — all optional
  weightKg:        numeric("weight_kg",        { precision: 5, scale: 2 }),
  temperature:     numeric("temperature",      { precision: 4, scale: 1 }),
  heartRate:       numeric("heart_rate",       { precision: 5, scale: 0 }),
  respiratoryRate: numeric("respiratory_rate", { precision: 4, scale: 0 }),

  // Free-text fallback for vets who don't use SOAP
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Consultation = typeof consultations.$inferSelect;
export type NewConsultation = typeof consultations.$inferInsert;
