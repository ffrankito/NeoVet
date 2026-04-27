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
// Si tocás esta lista, también actualizá la sección "Urgencias" en
// src/lib/prompts/whatsapp-system.ts. Hand-kept en sync (ver CLAUDE.md).
const L4_KEYWORDS = [
  // ─── Respiratorio (crítico para braquicefálicos) ───
  "no respira",
  "no puede respirar",
  "le cuesta respirar",
  "respira mal",
  "respira agitado", "respira agitada",
  "respiración agitada", "respiracion agitada",
  "respiración dificultosa", "respiracion dificultosa",
  "se ahoga",
  "ahogando",
  "se está ahogando", "se esta ahogando",
  "asfixia", "asfixiado", "asfixiada",
  "sin respirar",
  "boquea", "boqueando",
  "jadea mucho",

  // ─── Cianosis / color de mucosas ───
  "mucosas azules", "mucosa azul",
  "lengua azul",
  "encías azules", "encias azules",
  "está azul", "esta azul",
  "morado",
  "violeta",

  // ─── Hemorragia ───
  "sangrado", "sangrando",
  "hemorragia", "hemorragias",
  "hemorragia activa", "hemorragias activas",
  "pierde sangre",
  "mucha sangre",
  "no para de sangrar",
  "pierde sangre por la vulva",
  "sangra por abajo",

  // ─── Obstrucción urinaria (gatos especialmente) ───
  "obstrucción", "obstruccion",
  "gato obstruido", "gata obstruida",
  "obstruido", "obstruida",
  "no puede hacer pis",
  "no puede orinar",
  "no orina",
  "no hace pis",
  "no hizo pis",
  "no hizo pis en todo el día", "no hizo pis en todo el dia",
  "no puede hacer pipí", "no puede hacer pipi",
  "no puede hacer caca",

  // ─── Trauma / impacto ───
  "atropellado", "atropellada",
  "choque", "chocado", "chocada",
  "trauma",
  "golpe fuerte",
  "lo pisaron", "la pisaron",
  "se cayó", "se cayo",
  "cayó de altura", "cayo de altura",
  "accidente",
  "fractura", "fracturado", "fracturada",
  "se quebró", "se quebro",
  "se le quebró", "se le quebro",
  "no apoya la pata",

  // ─── Intoxicación / envenenamiento ───
  "envenenado", "envenenada",
  "intoxicado", "intoxicada",
  "intoxicación", "intoxicacion",
  "se comió veneno", "se comio veneno",
  "se comió chocolate", "se comio chocolate",
  "se comió uvas", "se comio uvas",
  "me lo envenenaron", "me la envenenaron",
  "espuma por la boca",
  "echa espuma", "echando espuma",
  "espumando",

  // ─── Neurológico / pérdida de consciencia ───
  "convulsión", "convulsion",
  "convulsionando",
  "temblando mucho",
  "espasmos",
  "desmayado", "desmayada",
  "perdió el conocimiento", "perdio el conocimiento",
  "no reacciona",
  "no responde",
  "no se mueve",

  // ─── Obstétricas (guardia 24 hs — nunca bajar a L3) ───
  "no puede parir",
  "parto complicado",
  "parto difícil", "parto dificil",
  "hace fuerza y no sale",
  "distocia",
  "líquido verde", "liquido verde",
  "líquido negro", "liquido negro",
  "líquido rojo", "liquido rojo",
  "cachorro trabado",
  "cachorro no sale",
  "sale una bolsita",

  // ─── Golpe de calor (riesgo braquicefálico extremo) ───
  "golpe de calor",
  "insolación", "insolacion",
  "se insoló", "se insolo",
  "no para de jadear",
  "se ahoga del calor",
  "no puede respirar del calor",

  // ─── Vómito / diarrea (solo con modificadores de severidad) ───
  "vomita mucho",
  "no para de vomitar",
  "vomita todo el día", "vomita todo el dia",
  "vomita sangre",
  "vómito con sangre", "vomito con sangre",
  "diarrea con sangre",
  "caca con sangre",

  // ─── Dolor severo / colapso ───
  "no se levanta",
  "no se puede levantar",
  "está como muerto", "esta como muerto",
  "parece muerto",
  "grita de dolor",
  "chilla de dolor",

  // ─── Señales generales ───
  "emergencia",
  "urgente",
  "urgencia",
  "urgentísimo", "urgentisimo",
  "se está muriendo", "se esta muriendo",
  "muriéndose", "muriendose",
  "crítico", "critico",
  "grave",
  "muy grave",
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