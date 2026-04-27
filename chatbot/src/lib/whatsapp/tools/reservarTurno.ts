import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

/**
 * Factory: `senderPhone` is the WhatsApp conversation's verified sender.
 * The CRM verifies the requested `patientId` belongs to a client with this
 * phone before creating the appointment, so a prompt-injected `patientId`
 * pointing at someone else's pet would 403, not silently book.
 */
export function createReservarTurno(senderPhone: string) {
  return tool({
    description:
      "Crea un turno real en el CRM. " +
      "Usá esta herramienta SOLO después de que el cliente confirmó explícitamente el turno.",
    parameters: z.object({
      patientId: z.string().describe("ID de la mascota en el CRM"),
      serviceId: z.string().optional().describe("ID del servicio elegido"),
      scheduledAt: z
        .string()
        .describe(
          "Fecha y hora en ISO 8601 UTC. Argentina es UTC-3, 9:30 ART = 12:30:00.000Z",
        ),
      reason: z.string().optional().describe("Motivo del turno"),
    }),
    execute: async ({ patientId, serviceId, scheduledAt, reason }) => {
      const res = await fetch(`${CRM_URL}/api/bot/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${BOT_API_KEY}`,
        },
        body: JSON.stringify({
          patientId,
          phone: senderPhone,
          serviceId: serviceId ?? null,
          scheduledAt,
          reason: reason ?? null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        return { ok: false, error: `Error creando turno: ${res.status} — ${JSON.stringify(error)}` };
      }
      return await res.json();
    },
  });
}
