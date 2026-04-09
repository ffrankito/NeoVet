import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "appointment_reminder_48h" | "appointment_reminder_24h" | "vaccine_reminder" | "follow_up"
  referenceId: text("reference_id").notNull(), // appointmentId, vaccinationId, followUpId
  sentTo: text("sent_to").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("email_logs_type_reference_id_idx").on(table.type, table.referenceId),
]);

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;