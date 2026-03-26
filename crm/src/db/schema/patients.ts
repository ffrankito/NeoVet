import { pgTable, text, date, timestamp } from "drizzle-orm/pg-core";
import { clients } from "./clients";

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed"),
  dateOfBirth: date("date_of_birth"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
