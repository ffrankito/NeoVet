import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { conversations } from "./conversations";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending_confirmation",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  petName: text("pet_name").notNull(),
  petSpecies: text("pet_species"),
  reason: text("reason"),
  status: appointmentStatusEnum("status").default("pending_confirmation").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  staffNotes: text("staff_notes"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
