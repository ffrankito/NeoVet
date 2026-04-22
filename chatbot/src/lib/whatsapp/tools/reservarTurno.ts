import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

export const reservarTurno = tool({
  description:
    "Crea un turno real en el CRM. " +
    "Usá esta herramienta SOLO después de que el cliente confirmó explícitamente el turno. " +
    "Requiere patientId, serviceId y la fecha+hora exacta.",
  parameters: z.object({
    patientId: z.string().describe("ID de la mascota en el CRM"),
    serviceId: z.string().optional().describe("ID del servicio elegido"),
    scheduledAt: z
      .string()
      .describe(
        "Fecha y hora en formato ISO 8601 UTC. " +
        "Argentina es UTC-3, entonces 9:30 ART = 12:30:00.000Z. " +
        "Ej: 2026-04-29T12:30:00.000Z"
      ),
    reason: z.string().optional().describe("Motivo del turno si el cliente lo mencionó"),
  }),
  execute: async ({ patientId, serviceId, scheduledAt, reason }) => {
    const res = await fetch(`${CRM_URL}/api/bot/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-api-key": BOT_API_KEY,
      },
      body: JSON.stringify({
        patientId,
        serviceId: serviceId ?? null,
        scheduledAt,
        reason: reason ?? null,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(`Error creando turno: ${res.status} — ${JSON.stringify(error)}`);
    }

    return await res.json(); // { id, ok: true }
  },
});