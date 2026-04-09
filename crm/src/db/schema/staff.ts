import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "owner", "vet", "groomer"] }).notNull(),
  licenseNumber: text("license_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type StaffRole = "admin" | "owner" | "vet" | "groomer";
