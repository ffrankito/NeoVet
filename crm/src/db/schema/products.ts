import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", [
  "medicamento", "vacuna", "insumo_clinico", "higiene",
  "accesorio", "juguete", "alimento", "transporte", "otro",
]);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: productCategoryEnum("category").notNull().default("otro"),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  sellPrice: numeric("sell_price", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: integer("tax_rate").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
