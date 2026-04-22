import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

export const buscarCliente = tool({
  description:
    "Busca un cliente en el CRM por su número de teléfono de WhatsApp. " +
    "Devuelve el cliente con sus mascotas si existe, o null si no existe.",
  parameters: z.object({
    phone: z.string().describe("Número de teléfono con código de país. Ej: 5493413101194"),
  }),
  execute: async ({ phone }) => {
    const res = await fetch(
      `${CRM_URL}/api/bot/clients?phone=${encodeURIComponent(phone)}`,
      { headers: { "authorization": `Bearer ${BOT_API_KEY}` } }
    );
    if (!res.ok) throw new Error(`Error buscando cliente: ${res.status}`);
    return await res.json();
  },
});