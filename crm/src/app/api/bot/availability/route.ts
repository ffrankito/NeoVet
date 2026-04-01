import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, scheduleBlocks, settings, services } from "@/db/schema";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { verifyBotApiKey } from "@/lib/bot-auth";

// Horarios por defecto si no están en settings
const DEFAULT_HOURS = {
  weekday: { start: "09:30", end: "12:30", afternoon_start: "16:30", afternoon_end: "20:00" },
  saturday: { start: "09:30", end: "12:30", afternoon_start: "16:30", afternoon_end: "20:00" },
  holiday: { start: "10:00", end: "13:00" },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push(minutesToTime(current));
    current += durationMinutes;
  }

  return slots;
}

export async function GET(req: NextRequest) {
  const authError = verifyBotApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  const serviceId = searchParams.get("serviceId");
  const days = parseInt(searchParams.get("days") ?? "7");

  if (!date) {
    return NextResponse.json({ error: "Parámetro date requerido" }, { status: 400 });
  }

  // Obtener duración del servicio
  let durationMinutes = 30;
  if (serviceId) {
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (service) durationMinutes = service.defaultDurationMinutes;
  }

  // Obtener settings de horarios
  const allSettings = await db.select().from(settings);
  const getSetting = (key: string) => allSettings.find((s) => s.key === key)?.value;

  const weekdayStart = getSetting("clinic_hours_weekday_morning_start") ?? DEFAULT_HOURS.weekday.start;
  const weekdayMorningEnd = getSetting("clinic_hours_weekday_morning_end") ?? DEFAULT_HOURS.weekday.end;
  const weekdayAfternoonStart = getSetting("clinic_hours_weekday_afternoon_start") ?? DEFAULT_HOURS.weekday.afternoon_start;
  const weekdayAfternoonEnd = getSetting("clinic_hours_weekday_afternoon_end") ?? DEFAULT_HOURS.weekday.afternoon_end;
  const holidayStart = getSetting("clinic_hours_holiday_start") ?? DEFAULT_HOURS.holiday.start;
  const holidayEnd = getSetting("clinic_hours_holiday_end") ?? DEFAULT_HOURS.holiday.end;

  const availability: Record<string, string[]> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(date + "T00:00:00.000Z");
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getUTCDay(); // 0 = domingo

    // Domingos no hay turnos
    if (dayOfWeek === 0) continue;

    // Generar slots según día
    let slots: string[] = [];
    if (dayOfWeek === 6) {
      // Sábado — solo mañana
      slots = generateSlots(weekdayStart, weekdayMorningEnd, durationMinutes);
    } else {
      // Lunes a viernes — mañana y tarde
      slots = [
        ...generateSlots(weekdayStart, weekdayMorningEnd, durationMinutes),
        ...generateSlots(weekdayAfternoonStart, weekdayAfternoonEnd, durationMinutes),
      ];
    }

    // Obtener turnos confirmados del día
    const fromDate = new Date(`${dateStr}T00:00:00.000Z`);
    const toDate = new Date(`${dateStr}T23:59:59.999Z`);

    const bookedAppointments = await db
      .select({ scheduledAt: appointments.scheduledAt, durationMinutes: appointments.durationMinutes })
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, fromDate),
          lte(appointments.scheduledAt, toDate),
          ne(appointments.status, "cancelled")
        )
      );

    // Obtener bloqueos del día
    const dayBlocks = await db
      .select()
      .from(scheduleBlocks)
      .where(
        and(
          lte(scheduleBlocks.startDate, dateStr),
          gte(scheduleBlocks.endDate, dateStr)
        )
      );

    // Si hay bloqueo de día completo, saltear el día
    const fullDayBlock = dayBlocks.some((b) => !b.startTime || !b.endTime);
    if (fullDayBlock) continue;

    // Filtrar slots ocupados por turnos
    const availableSlots = slots.filter((slot) => {
      const slotMinutes = timeToMinutes(slot);
      const slotEnd = slotMinutes + durationMinutes;

      // Verificar conflicto con turnos existentes
      const hasConflict = bookedAppointments.some((appt) => {
        const apptDate = new Date(appt.scheduledAt);
        const apptMinutes = apptDate.getUTCHours() * 60 + apptDate.getUTCMinutes();
        const apptEnd = apptMinutes + (appt.durationMinutes ?? 30);
        return slotMinutes < apptEnd && slotEnd > apptMinutes;
      });

      if (hasConflict) return false;

      // Verificar conflicto con bloqueos parciales
      const hasBlockConflict = dayBlocks.some((block) => {
        if (!block.startTime || !block.endTime) return false;
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        return slotMinutes < blockEnd && slotEnd > blockStart;
      });

      return !hasBlockConflict;
    });

    if (availableSlots.length > 0) {
      availability[dateStr] = availableSlots;
    }
  }

  return NextResponse.json(availability);
}