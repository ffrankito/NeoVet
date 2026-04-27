import { numeric, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { staff } from "./staff";

export const cashMovementTypeEnum = pgEnum("cash_movement_type", [
  "ingreso",
  "egreso",
]);

export const cashSessions = pgTable(
  "cash_sessions",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    openedById: text("opened_by_id").notNull().references(() => staff.id),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    initialAmount: numeric("initial_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    closingAmount: numeric("closing_amount", { precision: 12, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Enforce "only one open cash session at a time" at the DB level.
    // Prevents the TOCTOU race where two concurrent "Abrir caja" clicks both
    // pass the app-level "is there an open session?" check and both insert.
    oneOpenSession: uniqueIndex("cash_sessions_one_open_idx")
      .on(sql`((${table.closedAt} IS NULL))`)
      .where(sql`${table.closedAt} IS NULL`),
  }),
);

export const cashMovements = pgTable("cash_movements", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => cashSessions.id, { onDelete: "cascade" }),
  type: cashMovementTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("efectivo"),
  description: text("description").notNull(),
  createdById: text("created_by_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CashSession = typeof cashSessions.$inferSelect;
export type NewCashSession = typeof cashSessions.$inferInsert;
export type CashMovement = typeof cashMovements.$inferSelect;
export type NewCashMovement = typeof cashMovements.$inferInsert;
