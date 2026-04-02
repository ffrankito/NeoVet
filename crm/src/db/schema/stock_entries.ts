import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";
import { providers } from "./providers";
import { staff } from "./staff";

export const stockEntries = pgTable("stock_entries", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => providers.id, { onDelete: "set null" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdById: text("created_by_id").notNull().references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StockEntry = typeof stockEntries.$inferSelect;
export type NewStockEntry = typeof stockEntries.$inferInsert;
