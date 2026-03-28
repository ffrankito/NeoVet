import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}