import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 0 = Sunday, 6 = Saturday. null means this is a specific-date override.
  dayOfWeek: integer("day_of_week"),
  // If set, this rule applies only to this specific date (e.g. a holiday block)
  specificDate: date("specific_date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotDurationMinutes: integer("slot_duration_minutes").default(30).notNull(),
  // false = this slot is blocked (holiday, surgery day, etc.)
  isAvailable: boolean("is_available").default(true).notNull(),
  label: text("label"), // e.g. "Mañana", "Tarde", "Peluquería"
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
