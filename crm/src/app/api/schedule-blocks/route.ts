import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleBlocks, staff, appointments, patients, clients, services } from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { roleFromUser } from "@/lib/auth";
import { scheduleBlockId } from "@/lib/ids";
import { dateToStartART, dateToEndART } from "@/lib/timezone";
import { sendAndLogEmail } from "@/lib/email/send-email";
import { render } from "@react-email/render";
import { CancellationNotificationEmail } from "@/lib/email/templates/cancellation-notification";

// YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// HH:MM (00:00 .. 23:59)
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET — listar bloqueos del staff logueado en un rango de fechas
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  if (!staffMember[0]) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Parámetros from/to requeridos" }, { status: 400 });
  }

  const blocks = await db
    .select()
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.staffId, staffMember[0].id),
        lte(scheduleBlocks.startDate, to),
        gte(scheduleBlocks.endDate, from)
      )
    );

  return NextResponse.json(blocks);
}

// POST — crear un bloqueo
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Only clinical staff (admin, owner, vet) can suspend agendas — this
  // mass-cancels assigned appointments and emails clients. Groomers must
  // not be able to trigger that side-effect.
  const role = roleFromUser(user);
  if (!role || (role !== "admin" && role !== "owner" && role !== "vet")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const staffMember = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, user.id))
    .limit(1);

  if (!staffMember[0]) {
    return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const { startDate, endDate, startTime, endTime, reason } = body;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate y endDate son requeridos" }, { status: 400 });
  }
  if (typeof startDate !== "string" || !DATE_RE.test(startDate)) {
    return NextResponse.json({ error: "startDate debe tener formato YYYY-MM-DD" }, { status: 400 });
  }
  if (typeof endDate !== "string" || !DATE_RE.test(endDate)) {
    return NextResponse.json({ error: "endDate debe tener formato YYYY-MM-DD" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: "endDate no puede ser anterior a startDate" }, { status: 400 });
  }
  if (startTime != null && startTime !== "" && (typeof startTime !== "string" || !TIME_RE.test(startTime))) {
    return NextResponse.json({ error: "startTime debe tener formato HH:MM" }, { status: 400 });
  }
  if (endTime != null && endTime !== "" && (typeof endTime !== "string" || !TIME_RE.test(endTime))) {
    return NextResponse.json({ error: "endTime debe tener formato HH:MM" }, { status: 400 });
  }
  if (startTime && endTime && endTime < startTime) {
    return NextResponse.json({ error: "endTime no puede ser anterior a startTime" }, { status: 400 });
  }

  const block = await db
    .insert(scheduleBlocks)
    .values({
      id: scheduleBlockId(),
      staffId: staffMember[0].id,
      startDate,
      endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    })
    .returning();

  // Cancelar turnos existentes en el rango bloqueado (ART timezone)
  const blockStart = dateToStartART(startDate);
  const blockEnd = dateToEndART(endDate);

  // Fetch affected appointments before cancelling (for email notifications)
  const affectedAppointments = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      sendReminders: appointments.sendReminders,
      patientName: patients.name,
      clientName: clients.name,
      clientEmail: clients.email,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.assignedStaffId, staffMember[0].id),
        gte(appointments.scheduledAt, blockStart),
        lte(appointments.scheduledAt, blockEnd),
        ne(appointments.status, "cancelled"),
        ne(appointments.status, "completed")
      )
    );

  if (affectedAppointments.length > 0) {
    await db
      .update(appointments)
      .set({ status: "cancelled", cancellationReason: reason || "Suspensión de agenda" })
      .where(
        and(
          eq(appointments.assignedStaffId, staffMember[0].id),
          gte(appointments.scheduledAt, blockStart),
          lte(appointments.scheduledAt, blockEnd),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "completed")
        )
      );

    // Send cancellation emails to affected clients
    const cancellationReason = reason || "Suspensión de agenda del profesional";
    for (const apt of affectedAppointments) {
      if (apt.clientEmail && apt.sendReminders) {
        try {
          const html = await render(
            CancellationNotificationEmail({
              patientName: apt.patientName ?? "su mascota",
              clientName: apt.clientName ?? "Cliente",
              scheduledAt: new Date(apt.scheduledAt),
              serviceName: apt.serviceName,
              cancellationReason,
              clinicAddress: process.env.CLINIC_ADDRESS ?? "Morrow 4064, Rosario",
            })
          );

          await sendAndLogEmail({
            to: apt.clientEmail,
            subject: "Turno cancelado — NeoVet",
            html,
            logType: "cancellation",
            referenceId: apt.id,
          });
        } catch {
          // Email failure should not block the schedule block creation
        }
      }
    }
  }

  return NextResponse.json(block[0]);
}