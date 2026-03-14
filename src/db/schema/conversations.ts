import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";

export const conversationStatusEnum = pgEnum("conversation_status", [
  "open",
  "resolved",
  "escalated",
  "pending_vet",
]);

export const urgencyLevelEnum = pgEnum("urgency_level", ["L1", "L2", "L3", "L4"]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id),
  whatsappThreadId: text("whatsapp_thread_id").notNull().unique(),
  status: conversationStatusEnum("status").default("open").notNull(),
  // urgencyLevel only ever goes up (L1→L4). Only staff can downgrade via dashboard.
  urgencyLevel: urgencyLevelEnum("urgency_level").default("L1").notNull(),
  urgencyDetectedAt: timestamp("urgency_detected_at", { withTimezone: true }),
  assignedToStaff: text("assigned_to_staff"),
  summary: text("summary"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
