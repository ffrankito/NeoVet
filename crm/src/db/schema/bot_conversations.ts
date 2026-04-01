import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { botContacts } from "./bot_contacts";

export const botConversations = pgTable("bot_conversations", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull().references(() => botContacts.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "resolved", "escalated"] }).notNull().default("active"),
  urgencyLevel: integer("urgency_level").notNull().default(1),
  channel: text("channel", { enum: ["whatsapp", "web"] }).notNull().default("whatsapp"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotConversation = typeof botConversations.$inferSelect;
export type NewBotConversation = typeof botConversations.$inferInsert;