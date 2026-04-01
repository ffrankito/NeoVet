import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { staff } from "./staff";

export const botBusinessContext = pgTable("bot_business_context", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  category: text("category", { enum: ["faq", "horarios", "precios", "servicios", "contacto"] }).notNull(),
  updatedById: text("updated_by_id").references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotBusinessContext = typeof botBusinessContext.$inferSelect;
export type NewBotBusinessContext = typeof botBusinessContext.$inferInsert;