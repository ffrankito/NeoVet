import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const systemWithDate = `${SYSTEM_PROMPT}\n\n## Fecha actual\n\nHoy es ${today}.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemWithDate,
    messages,
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}