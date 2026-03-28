import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { consultations } from "./consultations";

export const documents = pgTable("documents", {
  id:             text("id").primaryKey(),
  patientId:      text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  consultationId: text("consultation_id")
    .references(() => consultations.id, { onDelete: "set null" }),
  fileName:       text("file_name").notNull(),      // original file name shown in UI
  storagePath:    text("storage_path").notNull(),   // path inside the bucket
  mimeType:       text("mime_type").notNull(),
  sizeBytes:      integer("size_bytes").notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
