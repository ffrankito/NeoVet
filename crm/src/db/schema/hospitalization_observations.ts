import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { hospitalizations } from "./hospitalizations";
import { staff } from "./staff";

export const hospitalizationObservations = pgTable("hospitalization_observations", {
  id: text("id").primaryKey(),
  hospitalizationId: text("hospitalization_id")
    .notNull()
    .references(() => hospitalizations.id, { onDelete: "cascade" }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  recordedById: text("recorded_by_id")
    .references(() => staff.id, { onDelete: "set null" }),

  // Vitals
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  temperature: numeric("temperature", { precision: 4, scale: 1 }),
  heartRate: numeric("heart_rate", { precision: 5, scale: 0 }),
  respiratoryRate: numeric("respiratory_rate", { precision: 4, scale: 0 }),

  // Physical exam
  capillaryRefillTime: text("capillary_refill_time"),
  mucousMembranes: text("mucous_membranes"),
  sensorium: text("sensorium"),

  // Clinical observations
  feeding: text("feeding"),
  hydration: text("hydration"),
  medication: text("medication"),
  urineOutput: text("urine_output"),
  fecesOutput: text("feces_output"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type HospitalizationObservation = typeof hospitalizationObservations.$inferSelect;
export type NewHospitalizationObservation = typeof hospitalizationObservations.$inferInsert;
