"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, lte, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { followUps, patients, clients } from "@/db/schema";
import { hasRole } from "@/lib/auth";

// Row shape for the UI.
export type FollowUpRow = {
  id: string;
  scheduledDate: string; // YYYY-MM-DD
  reason: string;
  status: "pending" | "done" | "dismissed";
  patientId: string;
  patientName: string;
  clientName: string;
  clientId: string;
  consultationId: string | null;
  procedureId: string | null;
  sentAt: Date | null;
  createdAt: Date;
  isOverdue: boolean;
};

const TODAY_STR = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

async function assertAllowed() {
  const allowed = await hasRole("admin", "owner", "vet");
  if (!allowed) throw new Error("No autorizado.");
}

export async function getFollowUps(
  statusFilter: "pending" | "done" | "dismissed" = "pending"
): Promise<FollowUpRow[]> {
  await assertAllowed();

  const today = TODAY_STR();

  const rows = await db
    .select({
      id: followUps.id,
      scheduledDate: followUps.scheduledDate,
      reason: followUps.reason,
      status: followUps.status,
      patientId: followUps.patientId,
      patientName: patients.name,
      clientName: clients.name,
      clientId: clients.id,
      consultationId: followUps.consultationId,
      procedureId: followUps.procedureId,
      sentAt: followUps.sentAt,
      createdAt: followUps.createdAt,
    })
    .from(followUps)
    .innerJoin(patients, eq(followUps.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .where(eq(followUps.status, statusFilter))
    .orderBy(
      // Pending: overdue first (oldest scheduled at top). Done/dismissed: most recent first.
      statusFilter === "pending"
        ? asc(followUps.scheduledDate)
        : desc(followUps.createdAt)
    );

  return rows.map((r) => ({
    ...r,
    isOverdue: r.status === "pending" && r.scheduledDate <= today,
  }));
}

/** Count pending follow-ups whose scheduledDate <= today (for the admin alert chip). */
export async function getOverdueFollowUpCount(): Promise<number> {
  const today = TODAY_STR();
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(followUps)
    .where(
      and(eq(followUps.status, "pending"), lte(followUps.scheduledDate, today))
    );
  return Number(row?.c ?? 0);
}

const idSchema = z.object({ id: z.string().min(1) });

async function flipStatus(
  formData: FormData,
  to: "pending" | "done" | "dismissed"
): Promise<void> {
  await assertAllowed();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("ID inválido.");

  await db
    .update(followUps)
    .set({ status: to })
    .where(eq(followUps.id, parsed.data.id));

  revalidatePath("/dashboard"); // refreshes both the inline section and the alert chip
}

export async function markFollowUpDone(formData: FormData): Promise<void> {
  await flipStatus(formData, "done");
}

export async function markFollowUpDismissed(formData: FormData): Promise<void> {
  await flipStatus(formData, "dismissed");
}

export async function reopenFollowUp(formData: FormData): Promise<void> {
  await flipStatus(formData, "pending");
}

