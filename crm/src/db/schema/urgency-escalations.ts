import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { messages } from "./messages";
import { urgencyLevelEnum } from "./conversations";

export const escalationActionEnum = pgEnum("escalation_action", [
  "notified_staff",
  "vet_called",
  "emergency_contact_sent",
  "resolved",
  "dismissed",
]);

export const urgencyEscalations = pgTable("urgency_escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  messageId: uuid("message_id").references(() => messages.id),
  urgencyLevel: urgencyLevelEnum("urgency_level").notNull(),
  triggerReason: text("trigger_reason"),
  aiSummary: text("ai_summary"),
  action: escalationActionEnum("action"),
  actionTakenBy: text("action_taken_by"),
  actionTakenAt: timestamp("action_taken_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UrgencyEscalation = typeof urgencyEscalations.$inferSelect;
export type NewUrgencyEscalation = typeof urgencyEscalations.$inferInsert;
