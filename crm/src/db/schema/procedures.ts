import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { hospitalizations } from "./hospitalizations";
import { staff } from "./staff";

export const procedures = pgTable("procedures", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  hospitalizationId: text("hospitalization_id")
    .references(() => hospitalizations.id, { onDelete: "set null" }),
  procedureDate: timestamp("procedure_date", { withTimezone: true }).notNull(),
  description: text("description").notNull(),
  type: text("type"), // surgery, dental, endoscopy, etc.
  asaScore: text("asa_score"), // '1' | '2' | '3' | '4' | '5' | '1E' | '2E' | '3E' | '4E' | '5E'

  // Pre-procedure vitals
  preWeightKg: numeric("pre_weight_kg", { precision: 5, scale: 2 }),
  preTemperature: numeric("pre_temperature", { precision: 4, scale: 1 }),
  preHeartRate: numeric("pre_heart_rate", { precision: 5, scale: 0 }),
  preRespiratoryRate: numeric("pre_respiratory_rate", { precision: 4, scale: 0 }),

  // Post-procedure vitals
  postWeightKg: numeric("post_weight_kg", { precision: 5, scale: 2 }),
  postTemperature: numeric("post_temperature", { precision: 4, scale: 1 }),
  postHeartRate: numeric("post_heart_rate", { precision: 5, scale: 0 }),
  postRespiratoryRate: numeric("post_respiratory_rate", { precision: 4, scale: 0 }),

  notes: text("notes"),
  createdById: text("created_by_id")
    .references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Join table: multiple staff members per procedure with roles */
export const procedureStaff = pgTable("procedure_staff", {
  id: text("id").primaryKey(),
  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "cascade" }),
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'surgeon' | 'anesthesiologist' | 'assistant'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Procedure = typeof procedures.$inferSelect;
export type NewProcedure = typeof procedures.$inferInsert;
export type ProcedureStaffRow = typeof procedureStaff.$inferSelect;
export type NewProcedureStaffRow = typeof procedureStaff.$inferInsert;
