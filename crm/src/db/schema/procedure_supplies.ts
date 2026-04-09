import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { procedures } from "./procedures";
import { products } from "./products";

export const procedureSupplies = pgTable("procedure_supplies", {
  id: text("id").primaryKey(),
  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProcedureSupply = typeof procedureSupplies.$inferSelect;
export type NewProcedureSupply = typeof procedureSupplies.$inferInsert;
