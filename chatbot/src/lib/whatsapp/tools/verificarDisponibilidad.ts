import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

export const verificarDisponibilidad = tool({
  description:
    "Verifica los horarios disponibles para un servicio en una fecha dada. " +
    "Devuelve un objeto con fechas como keys y arrays de horarios disponibles como values.",
  parameters: z.object({
    date: z.string().describe("Fecha de inicio en formato YYYY-MM-DD. Ej: 2026-04-28"),
    serviceId: z.string().optional().describe("ID del servicio para calcular la duración correcta."),
    days: z.number().min(1).max(14).default(3).describe("Días a consultar desde la fecha. Default 3."),
  }),
  execute: async ({ date, serviceId, days }) => {
    const params = new URLSearchParams({ date, days: String(days) });
    if (serviceId) params.set("serviceId", serviceId);
    const res = await fetch(
      `${CRM_URL}/api/bot/availability?${params.toString()}`,
      { headers: { "authorization": `Bearer ${BOT_API_KEY}` } }
    );
    if (!res.ok) return { disponible: false, error: `Error verificando disponibilidad: ${res.status}`, slots: {} };
    const availability: Record<string, string[]> = await res.json();
    if (Object.keys(availability).length === 0) {
      return { disponible: false, mensaje: "No hay turnos disponibles.", slots: {} };
    }
    return { disponible: true, slots: availability };
  },
});