import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
  role: text("role").notNull(), // 'surgeon' | 'anesthesiologist'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Procedure = typeof procedures.$inferSelect;
export type NewProcedure = typeof procedures.$inferInsert;
export type ProcedureStaffRow = typeof procedureStaff.$inferSelect;
export type NewProcedureStaffRow = typeof procedureStaff.$inferInsert;
