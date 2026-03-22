# ADR-001 — AI Provider: Vercel AI SDK + Claude claude-sonnet-4-6

**Date:** 2026-03-22
**Status:** Accepted

---

## Context

The NeoVet bot needs to handle natural language conversations in Spanish, answer FAQs, run a booking flow, analyze symptom descriptions, and triage urgency levels. This requires a capable LLM with tool-calling support, streaming, and multimodal input (images of sick pets). The project uses Next.js and TypeScript throughout.

## Decision

Use the Vercel AI SDK (`ai` package) with `@ai-sdk/anthropic` as the provider, targeting `claude-sonnet-4-6`.

## Alternatives Considered

| Option | Why rejected |
|--------|-------------|
| OpenAI GPT-4o via AI SDK | Claude has stronger Spanish-language performance and better instruction following for safety-critical flows (urgency triage) |
| Direct Anthropic SDK (no AI SDK wrapper) | Vercel AI SDK provides a unified interface for streaming, tool calling, and future provider switching without vendor lock-in |
| Google Gemini | Less mature tool-calling support at time of decision; team has no prior experience |

## Consequences

**Easier:** Streaming responses, tool calling, and multimodal (image) input are all handled by the SDK. Provider can be swapped without changing agent logic.

**Harder:** Adds a dependency layer between the app and the Anthropic API. SDK version upgrades may require migration work.

**Known limitations:** Model version `claude-sonnet-4-6` should be reviewed at the start of each phase — newer models may offer better performance or cost.
