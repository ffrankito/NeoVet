import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

/**
 * Factory: `senderPhone` is the WhatsApp conversation's verified sender.
 * Closing over it (instead of taking it from the model) prevents prompt
 * injection from making the bot look up a different number.
 */
export function createBuscarCliente(senderPhone: string) {
  return tool({
    description:
      "Busca al cliente que está enviando este WhatsApp. " +
      "Devuelve el cliente con sus mascotas si existe, o null si no existe.",
    // No parameters — phone is locked to the conversation's sender.
    parameters: z.object({}),
    execute: async () => {
      const res = await fetch(
        `${CRM_URL}/api/bot/clients?phone=${encodeURIComponent(senderPhone)}`,
        { headers: { authorization: `Bearer ${BOT_API_KEY}` } },
      );
      if (!res.ok) return { ok: false, error: `Error buscando cliente: ${res.status}` };
      return await res.json();
    },
  });
}
