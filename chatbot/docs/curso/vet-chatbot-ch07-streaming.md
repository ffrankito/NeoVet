# Ch 07 — Streaming (Advanced): Vet Chatbot Reference

> **Purpose:** Fine-grained control over what data streams to the frontend beyond plain text. Send custom UI parts, metadata, and handle errors gracefully.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. The chatbot needs to stream more than just text — it needs to stream appointment cards, product suggestions, status updates, and handle failures without crashing the UI.

---

## Chapter 7 Concepts — Where They Apply

### 1. Custom Data Parts (07.01)

**What it is:** Using `createUIMessageStream` with a `writer`, you can send custom typed data parts alongside the main text stream. Each part has a `type` (prefixed with `data-`), a unique `id`, and a `data` payload. The frontend switches on `type` to render the right component.

**Where it applies:**

```typescript
// Server: stream a follow-up suggestion after the main response
export type MyMessage = UIMessage<never, {
  suggestion: string;
  appointmentPreview: { date: string; time: string; service: string; };
}>;

const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // Stream the main text response
    const mainResult = streamText({ model, messages });
    writer.merge(mainResult.toUIMessageStream());
    await mainResult.consumeStream();

    // After main response, stream a follow-up suggestion
    const suggestionId = crypto.randomUUID();
    writer.write({
      id: suggestionId,
      type: 'data-suggestion',
      data: 'Would you like to book an appointment?',
    });
  },
});
```

**How to improve for the vet chatbot:**
- Stream **appointment preview cards** as `data-appointmentPreview` — show date, time, service, and price in a card before the user confirms.
- Stream **product cards** as `data-productCard` — image, name, price, stock status.
- Stream **quick reply buttons** as `data-suggestion` — "Book appointment", "See more products", "Talk to a human".
- Each data part can be **updated incrementally** by reusing the same `id` — the frontend replaces the previous version.

```typescript
// Frontend: render custom parts
if (part.type === 'data-suggestion') {
  return <QuickReplyButton text={part.data} onClick={() => sendMessage({ text: part.data })} />;
}
if (part.type === 'data-appointmentPreview') {
  return <AppointmentCard date={part.data.date} time={part.data.time} service={part.data.service} />;
}
```

---

### 2. Custom Data Parts with streamObject (07.02)

**What it is:** Combine `streamObject` (structured output streaming from Ch 1) with custom data parts. Stream a structured object incrementally and write each partial version as a data part.

**Where it applies:**
- Stream a **product recommendation list** — each product appears in the UI as soon as the LLM generates it, not after all 5 are ready.
- Stream a **booking summary** that fills in field-by-field: pet name ✓, date ✓, time loading...

```typescript
// Server: stream product recommendations as a structured object
const productsResult = streamObject({
  model,
  schema: z.object({
    recommendations: z.array(z.object({
      name: z.string(),
      reason: z.string(),
      price: z.string(),
    })),
  }),
  prompt: `Recommend products for a ${petType} with ${condition}`,
});

const partId = crypto.randomUUID();
for await (const partial of productsResult.partialObjectStream) {
  writer.write({
    id: partId,
    type: 'data-productRecommendations',
    data: partial.recommendations ?? [],
  });
}
```

**How to improve:**
- Use this for any **list-based output** — available time slots, matching products, care instructions.
- The frontend renders incrementally — clients see the first result immediately instead of waiting for all results.

---

### 3. Message Metadata (07.03)

**What it is:** Attach metadata to a message via `messageMetadata()` in `toUIMessageStreamResponse`. Metadata travels alongside the message but isn't part of the visible content. The frontend reads it from the message object.

**Where it applies:**
- **Response duration** — show "Responded in 1.2s" below each bot message (exactly as taught in the course).
- **Model used** — show which model handled the request (useful with model router from Ch 9).
- **Confidence level** — attach a confidence score to help the frontend decide if a disclaimer is needed.

```typescript
// Server:
const startTime = Date.now();

return result.toUIMessageStreamResponse<MyUIMessage>({
  messageMetadata({ part }) {
    if (part.type === 'finish') {
      return {
        duration: Date.now() - startTime,
        model: 'gemini-2.5-flash',
        confidence: 'high',
      };
    }
    return undefined;
  },
});

// Frontend:
<span className="text-xs text-gray-400">
  {message.metadata?.duration && `${(message.metadata.duration / 1000).toFixed(1)}s`}
  {message.metadata?.model && ` · ${message.metadata.model}`}
</span>
```

**How to improve:**
- Track duration per message to identify slow responses.
- Attach `intentDetected` metadata so the frontend can highlight the conversation type.
- Attach `toolsCalled` metadata for transparency ("This response used: calendar check, booking").

---

### 4. Error Handling (07.04)

**What it is:** Using `createUIMessageStream` with an `onError` callback to catch errors during streaming and return user-friendly messages instead of crashing the UI.

**Where it applies — critical for a production vet chatbot:**
- LLM provider down → "I'm having trouble right now. Please call us at [phone]."
- Rate limited → "We're experiencing high demand. Please try again in a moment."
- Tool execution failed (booking API down) → "I couldn't complete the booking. Please call our reception."
- Max retries exceeded → "Could not complete your request. Please try again."

```typescript
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    // ... your main logic
  },
  onError(error) {
    if (RetryError.isInstance(error)) {
      return 'I\'m having trouble connecting right now. Please try again, or call us at 555-VET-CLINIC.';
    }
    if (error.message?.includes('rate_limit')) {
      return 'We\'re experiencing high demand. Please wait a moment and try again.';
    }
    // Always provide a fallback with the clinic phone number
    return 'Something went wrong. Please call us at 555-VET-CLINIC for immediate assistance.';
  },
});
```

**How to improve:**
- **Always include the clinic phone number** in error messages — the client needs an alternative path.
- Log the actual error server-side for debugging, but only show friendly messages to the client.
- Differentiate between recoverable (retry) and non-recoverable (call us) errors.
- Test error paths with evals — inject failures and verify the error messages are correct.

---

## Architecture Impact

```
Streaming pipeline for the vet chatbot:

POST /api/chat
  └── createUIMessageStream({ execute, onError })
        │
        ├── writer.merge(streamText.toUIMessageStream())  ← Main text response
        │
        ├── writer.write({ type: 'data-suggestion' })     ← Quick reply buttons
        ├── writer.write({ type: 'data-appointmentPreview' }) ← Booking card
        ├── writer.write({ type: 'data-productCard' })    ← Product recommendations
        │
        ├── messageMetadata({ duration, model })           ← Performance info
        │
        └── onError → "Call us at 555-VET-CLINIC"         ← Graceful degradation

Frontend renders each type differently:
  text → Markdown bubble
  data-suggestion → Quick reply button
  data-appointmentPreview → Appointment card with confirm/cancel
  data-productCard → Product tile with image and price
  error → Error banner with phone number
```

---

## Quick Checklist: Is Chapter 7 Fully Applied?

- [ ] `createUIMessageStream` used (not just `toUIMessageStreamResponse`) for custom data parts
- [ ] Custom data parts defined for: suggestions, appointment previews, product cards
- [ ] Each data part has a unique `id` for incremental updates
- [ ] `streamObject` used for list-based outputs (products, time slots)
- [ ] `messageMetadata` attaches duration, model, and intent to each response
- [ ] `onError` handles: provider failures, rate limits, tool execution errors
- [ ] Error messages always include the clinic phone number as fallback
- [ ] Frontend has components for every custom data part type
- [ ] Errors logged server-side, friendly messages shown client-side
