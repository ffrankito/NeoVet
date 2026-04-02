// src/lib/calendar-utils.ts

export const CLINIC_START_HOUR = 9;
export const CLINIC_START_MINUTE = 30;
export const CLINIC_END_HOUR = 20;
export const CLINIC_SLOT_MINUTES = 30;

// Bloques horarios de la clínica
export const CLINIC_MORNING_END_HOUR = 12;
export const CLINIC_MORNING_END_MINUTE = 30;
export const CLINIC_AFTERNOON_START_HOUR = 16;
export const CLINIC_AFTERNOON_START_MINUTE = 30;

export type TimeSlot = {
  hour: number;
  minute: number;
  label: string;
  isBreak?: boolean; // true = slot de descanso visual, no disponible
};

/** Genera todos los slots del día con el corte del mediodía */
export function generateDaySlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Mañana: 9:30 a 12:30
  let hour = CLINIC_START_HOUR;
  let minute = CLINIC_START_MINUTE;
  while (
    hour < CLINIC_MORNING_END_HOUR ||
    (hour === CLINIC_MORNING_END_HOUR && minute < CLINIC_MORNING_END_MINUTE)
  ) {
    slots.push({ hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` });
    minute += CLINIC_SLOT_MINUTES;
    if (minute >= 60) { minute -= 60; hour += 1; }
  }

  // Descanso: 12:30 a 16:30
  slots.push({ hour: 12, minute: 30, label: "12:30", isBreak: true });

  // Tarde: 16:30 a 20:00
  hour = CLINIC_AFTERNOON_START_HOUR;
  minute = CLINIC_AFTERNOON_START_MINUTE;
  while (hour < CLINIC_END_HOUR || (hour === CLINIC_END_HOUR && minute === 0)) {
    slots.push({ hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` });
    minute += CLINIC_SLOT_MINUTES;
    if (minute >= 60) { minute -= 60; hour += 1; }
  }

  return slots;
}

/** Retorna el lunes de la semana que contiene la fecha dada */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day; // ajuste para que empiece en lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retorna array con los 7 días de la semana a partir del lunes */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Formatea una fecha como "lun 24/03" */
export function formatDayHeader(date: Date): string {
  const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const day = days[date.getDay()];
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${day} ${d}/${m}`;
}

/** Formatea una fecha como YYYY-MM-DD para comparaciones */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convierte hora/minuto a minutos desde medianoche */
export function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

// ─── Colores por categoría de servicio ───────────────────────────────────────

export type ServiceCategory =
  | "cirugia"
  | "consulta"
  | "reproduccion"
  | "cardiologia"
  | "peluqueria"
  | "vacunacion"
  | "domicilio"
  | "petshop"
  | "otro";

type ColorSet = { bg: string; border: string; text: string };

export const SERVICE_COLORS: Record<string, ColorSet> = {
  consulta:     { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-800"   },
  cirugia:      { bg: "bg-red-100",    border: "border-red-400",    text: "text-red-800"    },
  peluqueria:   { bg: "bg-pink-100",   border: "border-pink-400",   text: "text-pink-800"   },
  vacunacion:   { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-800"  },
  domicilio:    { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-800" },
  reproduccion: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-800" },
  cardiologia:  { bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-800" },
  petshop:      { bg: "bg-gray-100",   border: "border-gray-400",   text: "text-gray-800"   },
  otro:         { bg: "bg-gray-100",   border: "border-gray-400",   text: "text-gray-800"   },
};

export function getServiceColors(category?: string | null): ColorSet {
  return SERVICE_COLORS[category ?? "otro"] ?? SERVICE_COLORS["otro"];
}