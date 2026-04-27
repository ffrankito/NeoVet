import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

export const obtenerServicios = tool({
  description:
    "Obtiene la lista de servicios activos de la clínica con duración y precio. " +
    "Usá esta herramienta cuando el cliente quiere saber qué servicios hay " +
    "o cuando necesitás el serviceId para verificar disponibilidad.",
  parameters: z.object({}),
  execute: async () => {
    const res = await fetch(`${CRM_URL}/api/bot/services`, {
      headers: { "authorization": `Bearer ${BOT_API_KEY}` },
    });
    if (!res.ok) return [{ ok: false, error: `Error obteniendo servicios: ${res.status}` }];
    const services = await res.json();
    return services.map((s: {
      id: string;
      name: string;
      category: string;
      defaultDurationMinutes: number;
      basePrice: number | null;
    }) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      durationMinutes: s.defaultDurationMinutes,
      basePrice: s.basePrice,
    }));
  },
});