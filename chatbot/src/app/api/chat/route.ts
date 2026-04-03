import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 30;

async function getFeriadoHoy(): Promise<string | null> {
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`);
    if (!res.ok) return null;
    const feriados: { fecha: string; nombre: string }[] = await res.json();
    const hoy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const feriado = feriados.find((f) => f.fecha === hoy);
    return feriado?.nombre ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const feriadoHoy = await getFeriadoHoy();

  const feriadoNote = feriadoHoy
    ? `\n\n## Atención — hoy es feriado\n\nHoy es feriado nacional: **${feriadoHoy}**. El horario de atención es de 10:00 a 13:00 hs.`
    : "";

  const systemWithDate = `${SYSTEM_PROMPT}\n\n## Fecha actual\n\nHoy es ${today}.${feriadoNote}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemWithDate,
    messages,
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}