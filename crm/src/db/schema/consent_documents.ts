import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { consentTemplates } from "./consent_templates";
import { patients } from "./patients";
import { clients } from "./clients";
import { procedures } from "./procedures";
import { hospitalizations } from "./hospitalizations";
import { staff } from "./staff";

export const consentDocuments = pgTable("consent_documents", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .references(() => consentTemplates.id, { onDelete: "set null" }),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .references(() => clients.id, { onDelete: "set null" }),
  procedureId: text("procedure_id")
    .references(() => procedures.id, { onDelete: "set null" }),
  hospitalizationId: text("hospitalization_id")
    .references(() => hospitalizations.id, { onDelete: "set null" }),
  storagePath: text("storage_path"),
  customFields: jsonb("custom_fields"), // template-specific fields: diagnosis, procedure description, etc.
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  createdById: text("created_by_id")
    .references(() => staff.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ConsentDocument = typeof consentDocuments.$inferSelect;
export type NewConsentDocument = typeof consentDocuments.$inferInsert;
