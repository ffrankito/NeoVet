import { numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { appointments } from "./appointments";
import { staff } from "./staff";

export const priceTierEnum = pgEnum("price_tier", ["min", "mid", "hard"]);

export const groomingSessions = pgTable("grooming_sessions", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  groomedById: text("groomed_by_id")
    .notNull()
    .references(() => staff.id),
  priceTier: priceTierEnum("price_tier").notNull(),
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }),
  beforePhotoPath: text("before_photo_path"),
  afterPhotoPath: text("after_photo_path"),
  findings: text("findings").array(),
  notes: text("notes"),
  createdById: text("created_by_id").references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type GroomingSession = typeof groomingSessions.$inferSelect;
export type NewGroomingSession = typeof groomingSessions.$inferInsert;
