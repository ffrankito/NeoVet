import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { isRateLimited } from "@/lib/rate-limit";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 30;

// Cache holiday result for the current day (avoids re-fetching on every message)
let feriadoCache: { date: string; nombre: string | null } | null = null;

async function getFeriadoHoy(): Promise<string | null> {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Return cached result if it's still today
  if (feriadoCache && feriadoCache.date === hoy) {
    return feriadoCache.nombre;
  }

  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`);
    if (!res.ok) return null;
    const feriados: { fecha: string; nombre: string }[] = await res.json();
    const feriado = feriados.find((f) => f.fecha === hoy);
    const nombre = feriado?.nombre ?? null;
    feriadoCache = { date: hoy, nombre };
    return nombre;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Esperá un momento antes de escribir de nuevo." },
      { status: 429 }
    );
  }

  // Basic request validation
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Formato de mensajes inválido." }, { status: 400 });
  }

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