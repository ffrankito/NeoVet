import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { staff } from "./staff";

export const scheduleBlocks = pgTable("schedule_blocks", {
  id: text("id").primaryKey(),
  staffId: text("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(),     // YYYY-MM-DD (igual a startDate si es un día)
  startTime: text("start_time"),           // "09:30" — null = día completo
  endTime: text("end_time"),               // "12:30" — null = día completo
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type NewScheduleBlock = typeof scheduleBlocks.$inferInsert;