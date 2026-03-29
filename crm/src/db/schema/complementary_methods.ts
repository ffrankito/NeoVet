import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { consultations } from "./consultations";

export const complementaryMethods = pgTable("complementary_methods", {
  id:             text("id").primaryKey(),
  consultationId: text("consultation_id")
    .notNull()
    .references(() => consultations.id, { onDelete: "cascade" }),
  studyType:      text("study_type").notNull(),   // e.g. "Ecografía", "Hemograma"
  content:        text("content").notNull(),
  photoPath:      text("photo_path"),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ComplementaryMethod = typeof complementaryMethods.$inferSelect;
export type NewComplementaryMethod = typeof complementaryMethods.$inferInsert;
