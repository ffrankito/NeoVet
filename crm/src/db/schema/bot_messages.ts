import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { botConversations } from "./bot_conversations";

export const botMessages = pgTable("bot_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => botConversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  urgencyLevel: integer("urgency_level"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotMessage = typeof botMessages.$inferSelect;
export type NewBotMessage = typeof botMessages.$inferInsert;