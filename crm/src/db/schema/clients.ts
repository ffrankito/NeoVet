import { pgTable, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    dni: text("dni"),
    source: text("source").default("manual"),
    gvetId: text("gvet_id"),
    importedFromGvet: boolean("imported_from_gvet").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Phone is the bot's primary lookup key — UNIQUE both speeds up the lookup
    // and prevents the bot's TOCTOU duplicate-create race when two WhatsApp
    // messages from the same number arrive concurrently.
    phoneUnique: uniqueIndex("clients_phone_unique_idx").on(table.phone),
  }),
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
