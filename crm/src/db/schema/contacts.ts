import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  whatsappId: text("whatsapp_id").notNull().unique(),
  displayName: text("display_name"),
  phone: text("phone"),
  email: text("email"),
  petNames: text("pet_names").array().default([]),
  importedFromGvet: boolean("imported_from_gvet").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
