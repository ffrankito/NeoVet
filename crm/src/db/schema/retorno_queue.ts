import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { appointments } from "./appointments";
import { patients } from "./patients";
import { staff } from "./staff";

export const retornoTaskTypeEnum = pgEnum("retorno_task_type", [
  "sacar_sangre",
  "ecografia",
  "curacion",
  "aplicar_medicacion",
  "radiografia",
  "control_signos_vitales",
  "otro",
]);

export const retornoStatusEnum = pgEnum("retorno_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const retornoQueue = pgTable(
  "retorno_queue",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "restrict" }),
    taskType: retornoTaskTypeEnum("task_type").notNull(),
    notes: text("notes"),
    status: retornoStatusEnum("status").default("pending").notNull(),
    createdByStaffId: text("created_by_staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    assignedToStaffId: text("assigned_to_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    performedByStaffId: text("performed_by_staff_id").references(
      () => staff.id,
      { onDelete: "restrict" },
    ),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("retorno_queue_pending_idx")
      .on(table.status, table.createdAt)
      .where(sql`status <> 'completed'`),
    check(
      "retorno_queue_state_machine",
      sql`
        (status = 'pending' AND started_at IS NULL AND completed_at IS NULL AND performed_by_staff_id IS NULL)
        OR (status = 'in_progress' AND started_at IS NOT NULL AND completed_at IS NULL AND performed_by_staff_id IS NOT NULL)
        OR (status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL AND performed_by_staff_id IS NOT NULL)
      `,
    ),
  ],
);

export type RetornoQueueEntry = typeof retornoQueue.$inferSelect;
export type NewRetornoQueueEntry = typeof retornoQueue.$inferInsert;
