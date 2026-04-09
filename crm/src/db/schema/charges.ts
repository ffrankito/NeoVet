import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { staff } from "./staff";

export const charges = pgTable("charges", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // 'consultation' | 'grooming' | 'procedure' | 'sale' | 'hospitalization' | 'other'
  sourceId: text("source_id"), // polymorphic — no DB constraint
  description: text("description"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull(), // 'pending' | 'partial' | 'paid'
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdById: text("created_by_id")
    .references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Charge = typeof charges.$inferSelect;
export type NewCharge = typeof charges.$inferInsert;
export type ChargeSourceType = "consultation" | "grooming" | "procedure" | "sale" | "hospitalization" | "other";
export type ChargeStatus = "pending" | "partial" | "paid";
