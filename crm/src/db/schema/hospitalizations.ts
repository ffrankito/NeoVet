import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { consultations } from "./consultations";
import { staff } from "./staff";

export const hospitalizations = pgTable("hospitalizations", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  consultationId: text("consultation_id")
    .references(() => consultations.id, { onDelete: "set null" }),
  admittedAt: timestamp("admitted_at", { withTimezone: true }).notNull(),
  dischargedAt: timestamp("discharged_at", { withTimezone: true }),
  admittedById: text("admitted_by_id")
    .references(() => staff.id, { onDelete: "set null" }),
  dischargedById: text("discharged_by_id")
    .references(() => staff.id, { onDelete: "set null" }),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Hospitalization = typeof hospitalizations.$inferSelect;
export type NewHospitalization = typeof hospitalizations.$inferInsert;
