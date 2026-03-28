import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { consultations } from "./consultations";

export const vaccinations = pgTable("vaccinations", {
  id:             text("id").primaryKey(),
  patientId:      text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  consultationId: text("consultation_id")
    .references(() => consultations.id, { onDelete: "set null" }),
  vaccineName:    text("vaccine_name").notNull(),
  appliedAt:      text("applied_at").notNull(),   // YYYY-MM-DD
  nextDueAt:      text("next_due_at"),             // YYYY-MM-DD
  batchNumber:    text("batch_number"),
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;
