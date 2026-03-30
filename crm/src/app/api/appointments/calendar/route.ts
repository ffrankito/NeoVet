// src/app/api/appointments/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, patients, clients, services, staff } from "@/db/schema";
import { and, gte, lte, eq, ne } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const staffId = searchParams.get("staffId");

  if (!from || !to) {
    return NextResponse.json({ error: "Parámetros from/to requeridos" }, { status: 400 });
  }

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const conditions = [
    gte(appointments.scheduledAt, fromDate),
    lte(appointments.scheduledAt, toDate),
    ne(appointments.status, "cancelled"),
  ];

  if (staffId) {
    conditions.push(eq(appointments.assignedStaffId, staffId));
  }

  const rows = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      durationMinutes: appointments.durationMinutes,
      status: appointments.status,
      consultationType: appointments.consultationType,
      appointmentType: appointments.appointmentType,
      patientName: patients.name,
      clientName: clients.name,
      serviceName: services.name,
      serviceCategory: services.category,
      blockDurationMinutes: services.blockDurationMinutes,
      assignedStaffId: appointments.assignedStaffId,
      staffName: staff.name,
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(clients, eq(patients.clientId, clients.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.assignedStaffId, staff.id))
    .where(and(...conditions));

  return NextResponse.json(rows);
}