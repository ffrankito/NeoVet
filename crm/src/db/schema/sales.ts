import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { staff } from "./staff";
import { products } from "./products";

export const sales = pgTable("sales", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id, { onDelete: "set null" }),
  soldById: text("sold_by_id").notNull().references(() => staff.id),
  createdById: text("created_by_id").notNull().references(() => staff.id),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: integer("tax_rate").notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
