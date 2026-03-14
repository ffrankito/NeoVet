import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const businessContextCategoryEnum = pgEnum("business_context_category", [
  "faq",
  "hours",
  "services",
  "prices",
  "location",
  "emergency",
]);

export const businessContext = pgTable("business_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: businessContextCategoryEnum("category").notNull(),
  // Machine-readable key — used by the agent to fetch specific entries
  key: text("key").notNull().unique(),
  // Human-readable label shown in the admin UI
  title: text("title").notNull(),
  // The actual content injected into the AI system prompt
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedBy: text("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BusinessContext = typeof businessContext.$inferSelect;
export type NewBusinessContext = typeof businessContext.$inferInsert;
