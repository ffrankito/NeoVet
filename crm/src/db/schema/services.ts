import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const serviceCategoryEnum = pgEnum("service_category", [
  "cirugia",
  "consulta",
  "reproduccion",
  "cardiologia",
  "estetica",
  "vacunacion",
  "petshop",
  "otro",
  "endocrinologia",
]);

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: serviceCategoryEnum("category").notNull(),
  defaultDurationMinutes: integer("default_duration_minutes").notNull(),
  blockDurationMinutes: integer("block_duration_minutes"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;