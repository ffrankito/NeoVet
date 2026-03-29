import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";

export const groomingProfiles = pgTable("grooming_profiles", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .unique()
    .references(() => patients.id, { onDelete: "cascade" }),
  behaviorScore: integer("behavior_score"), // 1–10
  coatType: text("coat_type"),
  coatDifficulties: text("coat_difficulties"),
  behaviorNotes: text("behavior_notes"),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GroomingProfile = typeof groomingProfiles.$inferSelect;
export type NewGroomingProfile = typeof groomingProfiles.$inferInsert;
