import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { staff } from "./staff";
import { services } from "./services";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "veterinary",
  "grooming",
]);

export const consultationTypeEnum = pgEnum("consultation_type", [
  "clinica",
  "virtual",
  "domicilio",
]);

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentType: appointmentTypeEnum("appointment_type")
    .default("veterinary")
    .notNull(),
  assignedStaffId: text("assigned_staff_id").references(() => staff.id, {
    onDelete: "set null",
  }),
  serviceId: text("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  reason: text("reason"),
  status: appointmentStatusEnum("status").default("pending").notNull(),
  consultationType: consultationTypeEnum("consultation_type"),
  staffNotes: text("staff_notes"),
  sendReminders: boolean("send_reminders").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;