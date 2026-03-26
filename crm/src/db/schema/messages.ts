import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";

export const senderTypeEnum = pgEnum("sender_type", ["contact", "bot", "staff"]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "audio",
  "document",
  "location",
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  // Unique WhatsApp message ID — prevents double-processing the same webhook event
  whatsappMessageId: text("whatsapp_message_id").notNull().unique(),
  senderType: senderTypeEnum("sender_type").notNull(),
  messageType: messageTypeEnum("message_type").default("text").notNull(),
  body: text("body"),
  // Supabase Storage URL — permanent. WhatsApp CDN URLs expire after ~5 minutes.
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  aiAnalysis: text("ai_analysis"),
  urgencySignal: text("urgency_signal"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
