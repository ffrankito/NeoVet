import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const consentTemplates = pgTable("consent_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bodyTemplate: text("body_template").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ConsentTemplate = typeof consentTemplates.$inferSelect;
export type NewConsentTemplate = typeof consentTemplates.$inferInsert;
