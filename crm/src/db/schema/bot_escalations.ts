import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { botConversations } from "./bot_conversations";
import { staff } from "./staff";

export const botEscalations = pgTable("bot_escalations", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => botConversations.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  urgencyLevel: text("urgency_level").notNull(),
  resolvedById: text("resolved_by_id").references(() => staff.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BotEscalation = typeof botEscalations.$inferSelect;
export type NewBotEscalation = typeof botEscalations.$inferInsert;