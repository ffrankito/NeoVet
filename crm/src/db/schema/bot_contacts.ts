import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { clients } from "./clients";

export const botContacts = pgTable("bot_contacts", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
  name: text("name"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotContact = typeof botContacts.$inferSelect;
export type NewBotContact = typeof botContacts.$inferInsert;