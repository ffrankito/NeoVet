import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { consultations } from "./consultations";

export const followUps = pgTable("follow_ups", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  consultationId: text("consultation_id")
    .references(() => consultations.id, { onDelete: "set null" }),
  scheduledDate: date("scheduled_date").notNull(),
  reason: text("reason").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FollowUp = typeof followUps.$inferSelect;
export type NewFollowUp = typeof followUps.$inferInsert;