import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { staff } from "./staff";
import { services } from "./services";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
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

export const appointments = pgTable(
  "appointments",
  {
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
    cancellationReason: text("cancellation_reason"),
    sendReminders: boolean("send_reminders").default(true).notNull(),
    isWalkIn: boolean("is_walk_in").default(false).notNull(),
    isUrgent: boolean("is_urgent").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Hot path: every cron + calendar query filters/sorts by scheduledAt.
    // Negligible at smoke-seed scale; degrades fast post-Geovet import.
    scheduledAtIdx: index("appointments_scheduled_at_idx").on(table.scheduledAt),
  }),
);

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;