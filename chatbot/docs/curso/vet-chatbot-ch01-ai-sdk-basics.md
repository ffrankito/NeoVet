# Vet + Petshop + Grooming — AI Chatbot Reference

> **Purpose:** Import this document into your chatbot project so any AI coder understands the foundational concepts being applied (from AI SDK v5 Chapter 1) and where to improve.

---

## Business Context

A veterinary clinic with integrated petshop and grooming services. The chatbot serves clients who need to:

- Book **vet appointments** (consultations, vaccines, surgeries, emergencies)
- Schedule **grooming sessions** (bath, haircut, nail trimming, deshedding)
- Ask about and purchase **petshop products** (food, accessories, medication)
- Get **quick answers** (hours, pricing, pet care tips, post-visit instructions)

---

## Chapter 1 Concepts — Where They Apply

### 1. Provider Abstraction (`@ai-sdk/google`, `@ai-sdk/openai`, etc.)

**What it is:** The AI SDK lets you swap LLM providers with a single line change.

**Where it applies:**
- Use a fast/cheap model (`gemini-2.5-flash`) for routine queries: hours, prices, simple FAQ.
- Use a stronger model for nuanced tasks: interpreting pet symptoms described by the client, or resolving scheduling conflicts.
- Allows A/B testing providers without rewriting business logic.

**How to improve:**
- Implement a **model router** — a function that picks the model based on detected intent. Cheap model for FAQ, premium model for medical triage.
- Track cost-per-conversation to optimize spend.

---

### 2. `generateText()` — Full Response Generation

**What it is:** Sends a prompt, waits for the complete response. Blocking.

**Where it applies:**
- **Background tasks** where no user is waiting: generating a post-appointment summary email, creating a daily grooming schedule report, batch-processing product descriptions.
- Internal admin tools where latency is acceptable.

**How to improve:**
- Never use `generateText()` in the client-facing chat — always prefer streaming there.
- Use it for **pre-computing** answers to common questions (e.g., nightly FAQ refresh).

---

### 3. `streamText()` — Streaming Responses

**What it is:** Returns tokens incrementally as they're generated. Users see the response build in real-time.

**Where it applies:**
- **Every client-facing conversation.** When a pet owner asks "What vaccines does my puppy need?", they see the answer forming immediately instead of waiting 5-10 seconds.
- Critical for perceived responsiveness — especially on mobile where users are impatient.

**How to improve:**
- Add a **typing indicator** that activates the moment the stream starts.
- Consider **cancellation** — if the user sends a new message mid-stream, abort the current stream.

---

### 4. `UIMessageStream` + `toUIMessageStream()` + `createUIMessageStreamResponse()`

**What it is:** Structured streaming protocol where each chunk has a `type` field (`text-delta`, `tool-call`, `finish`). The server wraps the stream in an HTTP response the frontend can consume.

**Where it applies:**
- The **server endpoint** (`POST /api/chat`) that bridges frontend ↔ LLM.
- The frontend renders differently based on chunk type: text gets appended, tool calls could show a loading state for "checking availability...", finish triggers any post-message logic.

**How to improve:**
- Use `type` discrimination on the frontend to show **contextual UI**: a calendar widget when the bot is about to suggest times, a product card when recommending items.
- Add error handling for stream interruptions (network drops on mobile).

---

### 5. `useChat()` Hook — Client-Side Chat State

**What it is:** React hook from `@ai-sdk/react` that manages the full chat lifecycle: message history, sending, streaming state.

**Where it applies:**
- The **chat widget** embedded on the vet's website or app.
- Provides `messages`, `sendMessage`, and streaming status out of the box.

**How to improve:**
- **Persist conversation history** — store messages in localStorage or a database so returning clients don't lose context.
- Add `status` handling to disable the input while the bot is responding.
- Implement **suggested quick replies** below the chat (e.g., "Book appointment", "Grooming prices", "Store hours").

---

### 6. `convertToModelMessages()` — UI ↔ Model Message Bridge

**What it is:** Converts the UI message format (what the frontend sends) into the model message format (what the LLM expects). Handles text, images, and files transparently.

**Where it applies:**
- Every request in the `POST /api/chat` handler. The frontend sends `UIMessage[]`, this function converts them to `ModelMessage[]` before passing to `streamText()`.

**How to improve:**
- This is mostly infrastructure — keep it in the pipeline and don't skip it. It ensures multimodal content (images, files) is properly formatted.

---

### 7. System Prompt — The Bot's "Employee Manual"

**What it is:** The `system` parameter in `streamText()` that defines personality, rules, and constraints.

**Where it applies:** This is the **single most important customization point** for the vet chatbot.

**Recommended system prompt structure:**

```
You are "Luna", the virtual assistant for [Vet Clinic Name].

## Services
- Veterinary: consultations ($X), vaccines ($X), surgery (quote required), emergencies (24/7)
- Grooming: bath ($X-$X by size), haircut ($X-$X), nail trim ($X), deshedding ($X)
- Petshop: food brands [list], accessories, prescribed medication (requires vet approval)

## Business Hours
- Clinic: Mon-Fri 9am-8pm, Sat 9am-2pm
- Grooming: Mon-Sat 9am-6pm (last appointment 4pm)
- Petshop: Mon-Sat 9am-8pm
- Emergencies: 24/7 at [phone]

## Rules
- Be warm, empathetic, and professional. Pet owners are often anxious.
- NEVER diagnose conditions. If symptoms are described, say "I recommend scheduling a consultation so our vet team can evaluate [pet name]" and offer to book.
- For emergencies (poisoning, trauma, difficulty breathing), IMMEDIATELY provide the emergency number and say "Please call now or head to the clinic."
- Always ask for: pet name, species/breed, and owner name before booking.
- If unsure about product availability or pricing, say "Let me check with our team — can I have your phone number to get back to you?"
- Do not discuss competitor clinics or products.
- Respond in the same language the client uses.
```

**How to improve:**
- Make the system prompt **data-driven** — load services/prices/hours from a database or config file so they stay current without redeploying.
- Add **seasonal rules** (e.g., summer: "Remind clients about tick/flea prevention").
- Version-control the prompt and track how changes affect conversation quality.

---

### 8. Images & Files — Multimodal Input

**What it is:** The chat accepts file uploads; `convertToModelMessages()` handles passing them to the model.

**Where it applies:**
- Client uploads a **photo of their pet's skin condition** → bot describes what it sees and recommends a consultation.
- Client uploads a **photo of a product label** → bot identifies the product and checks if it's in stock.
- Client shares a **vaccine card photo** → bot extracts info and suggests which vaccines are due.

**How to improve:**
- Add **file type validation** — accept only images and PDFs, reject executables.
- Set a **size limit** to avoid slow uploads on mobile.
- Add a disclaimer: "I can describe what I see in the photo, but this is not a diagnosis. Please schedule a visit for a proper evaluation."

---

### 9. Structured Output (`Output.object()` + Zod)

**What it is:** Forces the LLM to return a typed JSON object instead of free text. You define the shape with a Zod schema.

**Where it applies:** This is how the chatbot goes from "conversation" to **actionable data**.

**Key schemas for the vet chatbot:**

```typescript
// Intent detection
z.object({
  intent: z.enum([
    "book_vet_appointment",
    "book_grooming",
    "cancel_appointment",
    "reschedule",
    "product_inquiry",
    "hours_and_location",
    "emergency",
    "general_question"
  ]),
  petName: z.string().optional(),
  petSpecies: z.enum(["dog", "cat", "bird", "rabbit", "other"]).optional(),
  petBreed: z.string().optional(),
  ownerName: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  service: z.string().optional(),
  urgency: z.enum(["normal", "urgent", "emergency"]).optional(),
})

// Product recommendation
z.object({
  products: z.array(z.object({
    name: z.string(),
    reason: z.string(),
    priceRange: z.string(),
  })),
  followUp: z.string().describe("What to ask the client next"),
})
```

**How to improve:**
- Use structured output as an **intermediate step** — extract intent first, then route to specialized handlers (booking flow, product search, FAQ).
- Stream partial objects (`partialOutputStream`) to show progress while the structure builds.
- Validate extracted dates/times against actual business hours before confirming.

---

### 10. Streaming Objects (`partialOutputStream`)

**What it is:** Like `streamText` but for structured objects — you get partial versions of the JSON as it builds.

**Where it applies:**
- When extracting appointment details from a conversation, show each field appearing in a **booking summary card** as the bot processes.
- When generating product recommendations, show each product card as it's ready rather than waiting for the full list.

**How to improve:**
- Render a **live form** that fills in as the partial object streams — client sees "Pet: Luna ✓, Date: Friday ✓, Service: loading..."
- Use it for **long lists** (e.g., product search results) so the first items appear fast.

---

## Architecture Blueprint

```
Client (web widget / mobile app)
  └── useChat() + sendMessage()
        └── POST /api/chat
              ├── system prompt (loaded from config/DB)
              ├── convertToModelMessages() — handles text + photos
              ├── streamText() with model router
              │     ├── FAQ/simple → gemini-flash (cheap)
              │     └── symptoms/complex → gemini-pro or gpt-4o
              └── Output.object() for intent extraction
                    ├── book_vet_appointment → Calendar/booking API
                    ├── book_grooming → Grooming schedule API
                    ├── product_inquiry → Inventory/catalog API
                    ├── emergency → Immediate escalation + phone number
                    └── general_question → Free-text streamed response
```

---

## What Chapter 1 Does NOT Cover (Next Steps)

These are capabilities you'll need that come from **later chapters**:

| Capability | Why You Need It | Likely Chapter |
|---|---|---|
| **Tool calling** | Let the bot actually invoke `checkAvailability()`, `createBooking()`, `searchProducts()` | Ch 2–3 |
| **Conversation memory** | Remember that "Luna" is a golden retriever across messages | Ch 2+ |
| **RAG (retrieval)** | Pull answers from your FAQ database, product catalog, or vet knowledge base | Ch 3+ |
| **Multi-step agents** | Handle complex flows: "Book Luna for grooming AND a vaccine, same day" | Ch 3+ |
| **Authentication** | Identify returning clients, show their pet history | Custom integration |
| **Handoff to human** | Escalate to a real receptionist when the bot can't help | Custom integration |

---

## Quick Checklist: Is Chapter 1 Fully Applied?

- [ ] Provider configured and model selected
- [ ] `streamText()` used for all client-facing responses (never `generateText`)
- [ ] `UIMessageStream` + `createUIMessageStreamResponse()` wired in API route
- [ ] `useChat()` managing frontend conversation state
- [ ] `convertToModelMessages()` bridging UI → model format
- [ ] System prompt written with clinic-specific services, hours, rules, and guardrails
- [ ] Image upload enabled for pet photos
- [ ] At least one `Output.object()` schema defined for intent extraction
- [ ] Devtools/logging configured for debugging LLM calls
