import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { WHATSAPP_SYSTEM_PROMPT } from "@/lib/prompts/whatsapp-system";
import { createBuscarCliente } from "./tools/buscarCliente";
import { createCrearClienteYPaciente } from "./tools/crearClienteYPaciente";
import { obtenerServicios } from "./tools/obtenerServicios";
import { verificarDisponibilidad } from "./tools/verificarDisponibilidad";
import { createReservarTurno } from "./tools/reservarTurno";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Palabras clave L4 — detección pre-AI
const L4_KEYWORDS = [
  "convulsión", "convulsion",
  "no respira",
  "atropellado",
  "envenenado",
  "sangrado",
  "no reacciona",
  "desmayado",
  "golpe fuerte",
  "obstrucción", "obstruccion",
  "emergencia",
  "urgente",
  "se está muriendo", "se esta muriendo",
  "ahogando",
  "sin pulso",
];

export function isL4Emergency(text: string): boolean {
  const lower = text.toLowerCase();
  return L4_KEYWORDS.some((kw) => lower.includes(kw));
}

export const L4_RESPONSE =
  "🚨 *URGENCIA DETECTADA*\n\n" +
  "Llamá ahora mismo al *+54 9 341 310-1194*\n\n" +
  "No esperes respuesta por chat — en emergencias el teléfono es más rápido.";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function runWhatsappAgent(
  messages: Message[],
  senderPhone: string
): Promise<string> {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const system = `${WHATSAPP_SYSTEM_PROMPT}\n\n## Fecha actual\n\nHoy es ${today}.`;

  // Inyectamos el teléfono del remitente en el primer mensaje
  const enrichedMessages = messages.map((m, i) => {
    if (i === 0 && m.role === "user") {
      return {
        ...m,
        content: `[Número de WhatsApp del remitente: ${senderPhone}]\n\n${m.content}`,
      };
    }
    return m;
  });

  // Phone-bound tools are instantiated per-conversation so `senderPhone` is
  // closed over by the runtime — the model cannot specify a different phone,
  // even via prompt injection. The CRM also re-verifies ownership server-side.
  const result = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages: enrichedMessages,
    tools: {
      buscarCliente: createBuscarCliente(senderPhone),
      crearClienteYPaciente: createCrearClienteYPaciente(senderPhone),
      obtenerServicios,
      verificarDisponibilidad,
      reservarTurno: createReservarTurno(senderPhone),
    },
    maxSteps: 10,
    maxTokens: 4096,
  });

  return result.text;
}