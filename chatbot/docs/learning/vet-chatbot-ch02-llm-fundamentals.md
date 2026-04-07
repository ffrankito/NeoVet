# Ch 02 — LLM Fundamentals: Vet Chatbot Reference

> **Purpose:** Understand the economics and physical constraints of LLMs so you can build a cost-efficient, performant vet chatbot.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. The chatbot handles appointment booking, grooming scheduling, product inquiries, and pet care Q&A.

---

## Chapter 2 Concepts — Where They Apply

### 1. Tokens (02.01)

**What it is:** LLMs don't read text — they read *tokens* (subword chunks). A tokenizer like `o200k_base` splits text into numeric IDs. The number of tokens directly determines cost and latency.

**Where it applies:**
- Every message your vet chatbot sends and receives is billed per token.
- A long system prompt describing all services, hours, and rules consumes tokens on *every single request*.
- Client messages with pet history, symptoms, and photos all convert to tokens.

**How to improve:**
- **Measure your system prompt's token count.** Use a tokenizer to check — if your clinic description is 800 tokens, that's 800 tokens charged on every message.
- Keep the system prompt lean — move rarely-needed details (e.g., full product catalog) to retrieval instead of stuffing everything in the prompt.
- Monitor average tokens-per-conversation to estimate monthly costs.

---

### 2. Usage Tracking (02.02)

**What it is:** After every `streamText()` or `generateText()` call, `await output.usage` returns `{ promptTokens, completionTokens, totalTokens }`. This is how you measure real cost.

**Where it applies:**
- Track cost per conversation to understand your unit economics (e.g., "each booking conversation costs $0.003").
- Set alerts if usage spikes (e.g., a client pasting an entire PDF of medical records).

**How to improve:**
- **Log usage on every request** — store `promptTokens` and `completionTokens` alongside each chat session.
- Build a dashboard: cost per day, cost per conversation type (booking vs FAQ vs product inquiry).
- Set a **per-conversation token budget** — if a conversation exceeds 50k tokens, politely suggest calling the clinic.

```typescript
// After streamText:
const usage = await output.usage;
console.log(`Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}`);
// Store in your analytics DB
```

---

### 3. Data Represented as Tokens (02.03)

**What it is:** The *format* you use to represent data affects token count. The same data in JSON, XML, or Markdown consumes different numbers of tokens. Markdown is typically the most token-efficient.

**Where it applies:**
- When injecting **service lists, product catalogs, or appointment slots** into the prompt, the format matters.
- A list of 50 products as JSON could cost 2x the tokens compared to Markdown.

**How to improve:**
- Use **Markdown** for injecting structured data into prompts (service lists, schedules).
- Use **XML tags** for semantic boundaries (like the Anthropic template pattern from Ch 5) — they're worth the small token overhead for clarity.
- Avoid verbose JSON in prompts unless the LLM needs to parse it structurally.

```
# Token-efficient (Markdown):
- Bath (small dog): $25
- Bath (large dog): $40
- Nail trim: $15

# Token-expensive (JSON):
[{"service": "Bath (small dog)", "price": 25}, {"service": "Bath (large dog)", "price": 40}]
```

---

### 4. Context Window (02.04)

**What it is:** Every model has a maximum number of tokens it can process in a single request (prompt + completion combined). Gemini 2.5 Flash has ~1M tokens. If you exceed it, the request fails.

**Where it applies:**
- Long conversation histories with returning clients can grow large over time.
- Injecting pet medical records, product catalogs, or clinic documents can eat context fast.
- Image tokens are particularly expensive — a single photo can consume thousands of tokens.

**How to improve:**
- **Implement conversation truncation** — keep only the last N messages, or summarize older messages.
- For the vet chatbot, a sliding window of the last 20 messages is usually sufficient — clients rarely reference messages from 50 turns ago.
- Move large reference data (full product catalog, medical guides) to **retrieval** (Ch 5) instead of cramming into context.
- Set `maxRetries: 0` or low retry counts for requests you know might be large, to avoid burning tokens on retries.

```
Practical limits for the vet chatbot:
- System prompt: ~500-800 tokens (lean but complete)
- Conversation history: ~2,000-5,000 tokens (last 10-20 messages)
- Retrieved context: ~1,000-3,000 tokens (on-demand)
- Completion: ~500-1,000 tokens
- Total per request: ~4,000-10,000 tokens (well within any model's window)
```

---

### 5. Prompt Caching (02.05)

**What it is:** If the beginning of your prompt matches a previous request (same token sequence), the provider can cache those tokens and charge less for subsequent calls. This applies to system prompts and shared context.

**Where it applies:**
- Your **system prompt is identical across all clients** — it describes the clinic, services, and rules. This is a perfect caching candidate.
- The **conversation history** is also cacheable — each new message only adds tokens at the end, so the prefix (all previous messages) can be cached.

**How to improve:**
- **Keep your system prompt at the very beginning** of the token sequence and don't change it between requests — this maximizes cache hits.
- Structure messages so the cacheable prefix (system + history) comes first, and the new user message is appended at the end.
- This is mostly automatic with the AI SDK's message format, but be aware: if you dynamically inject different data into the system prompt (e.g., current date, live stock levels), you break the cache.
- Consider injecting volatile data (today's date, current promotions) as a **separate user/assistant message** rather than in the system prompt.

---

## Architecture Impact

```
Request flow with cost awareness:

Client message arrives
  ├── System prompt (fixed, cached) .............. ~500 tokens (cached = cheap)
  ├── Conversation history (mostly cached) ....... ~2,000 tokens (prefix cached)
  ├── New user message ........................... ~50-200 tokens (uncached)
  ├── Retrieved context (if needed) .............. ~1,000-3,000 tokens (uncached)
  └── Completion ................................. ~300-800 tokens (output)

Total: ~4,000-5,000 tokens/request
At Gemini Flash pricing: ~$0.001-0.002 per message
Monthly estimate (1,000 conversations × 10 messages avg): ~$10-20/month
```

---

## Quick Checklist: Is Chapter 2 Fully Applied?

- [ ] System prompt token count measured and optimized (<800 tokens)
- [ ] `usage` tracked and logged on every LLM call
- [ ] Data injected into prompts uses token-efficient format (Markdown preferred)
- [ ] Conversation history has a truncation/summarization strategy
- [ ] System prompt is stable (not dynamically changing) to maximize prompt caching
- [ ] Cost-per-conversation estimated and monitored
- [ ] Token budget set per conversation to prevent runaway costs
