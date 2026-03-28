import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { consultations } from "./consultations";

export const dewormingRecords = pgTable("deworming_records", {
  id:             text("id").primaryKey(),
  patientId:      text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  consultationId: text("consultation_id")
    .references(() => consultations.id, { onDelete: "set null" }),
  product:        text("product").notNull(),
  appliedAt:      text("applied_at").notNull(),   // YYYY-MM-DD
  nextDueAt:      text("next_due_at"),             // YYYY-MM-DD
  dose:           text("dose"),                    // e.g. "2.5ml", "1 comprimido"
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DewormingRecord = typeof dewormingRecords.$inferSelect;
export type NewDewormingRecord = typeof dewormingRecords.$inferInsert;
