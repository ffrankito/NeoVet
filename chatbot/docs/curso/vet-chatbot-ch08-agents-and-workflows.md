# Ch 08 — Agents & Workflows: Vet Chatbot Reference

> **Purpose:** Orchestrate multi-step AI processes where the output of one LLM call feeds into the next. Move beyond single request-response into structured, multi-phase flows.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. Many real interactions require multiple steps: draft a message → evaluate → refine, or classify → retrieve → respond. Workflows give you explicit control over these sequences.

---

## Chapter 8 Concepts — Where They Apply

### 1. Workflows (08.01)

**What it is:** A deterministic sequence of LLM calls where each step has a specific role. Unlike free-form agents, workflows follow a fixed pipeline: Step A → Step B → Step C. The course demonstrates: write first draft → evaluate → write final draft.

**Where it applies:**

**Appointment Booking Workflow:**
```
Step 1: Extract booking intent (generateText)
  → { service, preferredDate, petName, clientName }

Step 2: Validate and enrich (generateText)
  → Check if all required fields are present
  → If missing, generate a follow-up question

Step 3: Generate client-facing response (streamText)
  → Present available slots or ask for missing info
```

**Post-Visit Summary Workflow:**
```
Step 1: Generate visit summary from vet notes (generateText)
Step 2: Evaluate for medical accuracy and tone (generateText)
Step 3: Write final client-friendly summary (streamText → to client)
```

**Product Recommendation Workflow:**
```
Step 1: Classify pet needs from conversation (generateText)
Step 2: Search product catalog (tool call)
Step 3: Rank and explain recommendations (streamText → to client)
```

```typescript
export const POST = async (req: Request) => {
  const { messages } = await req.json();
  const history = formatMessageHistory(messages);

  // Step 1: Extract intent
  const intentResult = await generateText({
    model: google('gemini-2.5-flash'),
    system: EXTRACT_BOOKING_INTENT_PROMPT,
    prompt: history,
  });

  // Step 2: Validate completeness
  const validationResult = await generateText({
    model: google('gemini-2.5-flash'),
    system: VALIDATE_BOOKING_FIELDS_PROMPT,
    prompt: `Intent: ${intentResult.text}\nHistory: ${history}`,
  });

  // Step 3: Generate response
  const response = streamText({
    model: google('gemini-2.5-flash'),
    system: GENERATE_BOOKING_RESPONSE_PROMPT,
    prompt: `Intent: ${intentResult.text}\nValidation: ${validationResult.text}\nHistory: ${history}`,
  });

  return response.toUIMessageStreamResponse();
};
```

**How to improve:**
- Each step has a **focused system prompt** — one job per LLM call is more reliable than asking the LLM to do everything at once.
- Only the final step uses `streamText` — intermediate steps use `generateText` since the client doesn't need to see them.

---

### 2. Streaming Custom Data During Workflows (08.02)

**What it is:** Stream intermediate results to the frontend as custom data parts while the workflow runs. The client sees progress instead of waiting in silence for a multi-step pipeline.

**Where it applies:**

```typescript
const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // Show "Checking availability..." while Step 1 runs
    const statusId = crypto.randomUUID();
    writer.write({ type: 'data-status', data: 'Checking availability...', id: statusId });

    const slots = await checkAvailability(date, service);

    // Update status
    writer.write({ type: 'data-status', data: 'Found 3 available slots', id: statusId });

    // Show available slots as a card
    const slotsId = crypto.randomUUID();
    writer.write({ type: 'data-availableSlots', data: slots, id: slotsId });

    // Stream the final text response
    const response = streamText({ model, prompt: `...` });
    writer.merge(response.toUIMessageStream());
  },
});
```

**How to improve:**
- Show **workflow progress** as a stepper: "Step 1/3: Checking availability ✓ → Step 2/3: Preparing booking..."
- Stream intermediate data parts using the **same id** to update them in-place (e.g., a status bar that progresses).
- Don't leave the client staring at nothing — always stream *something* while background steps run.

---

### 3. Creating Your Own Loop (08.03)

**What it is:** A `while` loop where each iteration calls the LLM, evaluates the result, and decides whether to iterate again. The course demonstrates: write draft → get feedback → revise → get feedback → finalize.

**Where it applies:**

**Iterative Response Refinement:**
```typescript
let step = 0;
let draft = '';
let feedback = '';

while (step < 3) {
  // Generate/refine the response
  const draftResult = streamText({
    model,
    prompt: `
      Client question: ${clientMessage}
      Previous draft: ${draft}
      Previous feedback: ${feedback}
      Write an improved response for the vet clinic chatbot.
    `,
  });

  // Stream draft to frontend
  const draftId = crypto.randomUUID();
  for await (const chunk of draftResult.textStream) {
    draft += chunk;
    writer.write({ type: 'data-draft', data: draft, id: draftId });
  }

  // Evaluate the draft
  const evalResult = streamText({
    model,
    system: `Evaluate this vet chatbot response. Is it empathetic, accurate, and complete?`,
    prompt: `Client: ${clientMessage}\nBot response: ${draft}`,
  });

  // Stream feedback
  const feedbackId = crypto.randomUUID();
  for await (const chunk of evalResult.textStream) {
    feedback += chunk;
    writer.write({ type: 'data-feedback', data: feedback, id: feedbackId });
  }

  step++;
}

// Emit final text
writer.write({ type: 'text-start', id: crypto.randomUUID() });
writer.write({ type: 'text-delta', delta: draft, id: /* same id */ });
writer.write({ type: 'text-end', id: /* same id */ });
```

**How to improve:**
- Use this pattern for **high-stakes responses**: emergency triage instructions, post-surgery care guides, complex booking confirmations.
- For routine responses (FAQ, hours), skip the loop — single-pass is fine.
- Keep iteration count low (2-3 max) to avoid excessive latency and cost.

---

### 4. Breaking the Loop Early (08.04)

**What it is:** Use `streamObject` with a schema that includes an `isGoodEnough` boolean. When the evaluator says the draft is good enough, `break` out of the loop early. Saves tokens and time.

**Where it applies:**

```typescript
const evalResult = streamObject({
  model,
  system: EVALUATE_RESPONSE_PROMPT,
  prompt: `Client: ${clientMessage}\nBot response: ${draft}`,
  schema: z.object({
    feedback: z.string().optional().describe('Only if the draft needs improvement'),
    isGoodEnough: z.boolean().describe('Whether the response is ready to send'),
  }),
});

for await (const part of evalResult.partialObjectStream) {
  if (part.feedback) {
    writer.write({ type: 'data-feedback', data: part.feedback, id: feedbackId });
  }
}

const finalEval = await evalResult.object;

if (finalEval.isGoodEnough) {
  break; // Exit the loop early — response is ready
}

feedback = finalEval.feedback ?? '';
```

**How to improve:**
- Add an **urgency check** — for emergencies, break immediately after the first draft (speed > polish).
- Log how many iterations each conversation takes — if most break at iteration 1, you might not need the loop at all for that intent type.
- Use the `isGoodEnough` pattern for any self-improving loop.

---

## Architecture Impact

```
Simple query (FAQ, hours):
  → Single streamText → Response (no workflow needed)

Medium complexity (booking):
  → Workflow: Extract intent → Validate → Respond
  → Custom data parts stream progress to frontend

High complexity (multi-service booking, care plan):
  → Loop: Draft → Evaluate → Refine → Break when good enough
  → Each iteration streams draft + feedback to frontend
  → Final draft emitted as text
```

---

## Quick Checklist: Is Chapter 8 Fully Applied?

- [ ] Multi-step workflows defined for booking, product recommendation, and post-visit summaries
- [ ] Each workflow step has a focused, single-purpose system prompt
- [ ] Only the final step streams to the client; intermediate steps use `generateText`
- [ ] Custom data parts stream progress during workflows (status, drafts, feedback)
- [ ] Self-improving loop implemented for high-stakes responses
- [ ] `isGoodEnough` pattern used to break loops early and save tokens
- [ ] Max iteration count set (2-3) to cap latency and cost
- [ ] Emergency path bypasses loops for speed
- [ ] Manual `text-start` / `text-delta` / `text-end` used when emitting final text from a custom stream
