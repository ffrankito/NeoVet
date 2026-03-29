import { pgEnum, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { consultations } from "./consultations";

export const treatmentStatusEnum = pgEnum("treatment_status", [
  "pending",
  "active",
  "completed",
]);

export const treatmentItems = pgTable("treatment_items", {
  id:             text("id").primaryKey(),
  consultationId: text("consultation_id")
    .notNull()
    .references(() => consultations.id, { onDelete: "cascade" }),
  description:    text("description").notNull(),
  medication:     text("medication"),
  dose:           text("dose"),
  frequency:      text("frequency"),
  durationDays:   integer("duration_days"),
  status:         treatmentStatusEnum("status").default("pending").notNull(),
  order:          integer("order").default(0).notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TreatmentItem = typeof treatmentItems.$inferSelect;
export type NewTreatmentItem = typeof treatmentItems.$inferInsert;
