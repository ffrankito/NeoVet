# Ch 05 — Context Engineering: Vet Chatbot Reference

> **Purpose:** Make the LLM smarter by giving it better input. The quality of your chatbot's answers depends entirely on the quality of the context you provide.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. The chatbot needs to answer accurately about services, products, pet care, and clinic policies — all without hallucinating.

---

## Chapter 5 Concepts — Where They Apply

### 1. The Prompt Template (05.01)

**What it is:** A structured prompt with labeled sections using XML tags: `<task-context>`, `<tone-context>`, `<background-data>`, `<rules>`, `<examples>`, `<conversation-history>`, `<the-ask>`, `<thinking-instructions>`, `<output-formatting>`. This is the Anthropic-recommended structure.

**Where it applies:** Your **entire system prompt and per-request prompt** should follow this template.

**Vet chatbot prompt template:**

```typescript
const vetPrompt = (opts: {
  clinicInfo: string;
  conversationHistory: string;
  latestQuestion: string;
  retrievedContext?: string;
}) => `
<task-context>
  You are "Luna", the virtual assistant for [Vet Clinic Name]. Your goal is to help pet owners book appointments, answer questions about services, and provide basic pet care guidance.
</task-context>

<tone-context>
  Be warm, empathetic, and professional. Pet owners are often anxious about their pets. Use the pet's name when known.
</tone-context>

<background-data>
  <clinic-info>
  ${opts.clinicInfo}
  </clinic-info>
  ${opts.retrievedContext ? `<retrieved-context>${opts.retrievedContext}</retrieved-context>` : ''}
</background-data>

<rules>
  - NEVER diagnose conditions. Always recommend a consultation.
  - For emergencies, IMMEDIATELY provide the emergency number.
  - Always confirm: pet name, species/breed, and owner name before booking.
  - If unsure about availability or pricing, say "Let me check with our team."
  - Respond in the same language the client uses.
</rules>

<conversation-history>
${opts.conversationHistory}
</conversation-history>

<the-ask>
${opts.latestQuestion}
</the-ask>
`;
```

**How to improve:**
- Keep the template as a **function** — not a static string. This lets you inject dynamic data per request.
- Separate the clinic info (services, hours, prices) into a loadable config so it stays current without code changes.

---

### 2. Basic Prompting (05.02)

**What it is:** Using the template sections to constrain the LLM's behavior: `<rules>` for constraints, `<output-format>` for structure, `<the-ask>` for the specific request.

**Where it applies:**
- **Title generation** for chat conversations (shown in the course) — directly applicable to the vet chatbot's conversation list.
- **Intent classification** — use a focused prompt to categorize the client's request before routing.

```typescript
// Generate a title for each vet chat conversation:
const titlePrompt = `
<task-context>
You are generating a title for a vet clinic chat conversation.
</task-context>

<conversation-history>
${firstUserMessage}
</conversation-history>

<rules>
- Titles should be at most 30 characters.
- Include the pet's name if mentioned.
- Use sentence case. No period at the end.
- Examples: "Luna's Vaccine Appointment", "Grooming for Max", "Cat Food Inquiry"
</rules>

<the-ask>
Generate a title for this conversation.
</the-ask>

<output-format>
Return only the title.
</output-format>
`;
```

**How to improve:**
- Use this pattern for **every sub-task** the chatbot performs: title generation, intent classification, summary generation, follow-up suggestions.

---

### 3. Exemplars / Few-Shot (05.03)

**What it is:** Provide examples of input → expected output pairs so the LLM learns the pattern. More effective than just describing what you want.

**Where it applies:**
- **Intent classification** — show the LLM examples of how to categorize messages:

```typescript
const exemplars = [
  {
    input: "Hi, I need to bring my cat for her annual vaccines",
    expected: "book_vet_appointment",
  },
  {
    input: "How much does a bath cost for a golden retriever?",
    expected: "grooming_inquiry",
  },
  {
    input: "My dog is vomiting and can't stand up",
    expected: "emergency",
  },
  {
    input: "Do you sell Royal Canin for puppies?",
    expected: "product_inquiry",
  },
  {
    input: "What time do you close on Saturdays?",
    expected: "hours_inquiry",
  },
];
```

- **Response tone** — show examples of how the bot should handle sensitive situations:

```typescript
const toneExemplars = [
  {
    input: "My dog has been limping for two days",
    expected: "I'm sorry to hear that about [pet name]. Limping can have various causes, and it's best to have our vet team take a look. Would you like me to check available consultation times for you?",
  },
];
```

**How to improve:**
- Maintain a **curated set of exemplars** per intent category.
- Update exemplars based on real conversations — when the bot handles a case particularly well, add it as an exemplar.
- Use 2-5 exemplars per category. More isn't always better — it wastes tokens.

---

### 4. Retrieval / RAG (05.04)

**What it is:** Instead of cramming all knowledge into the prompt, *retrieve* relevant information on-demand based on the user's question. The course uses Tavily to scrape web content and inject it as `<background-data>`.

**Where it applies — this is critical for the vet chatbot:**

- **Product catalog** — don't put 500 products in the prompt. Search your inventory DB and inject only the 5-10 relevant products.
- **Pet care knowledge base** — retrieve articles about specific conditions, breeds, post-surgery care.
- **Clinic policies** — retrieve the specific policy relevant to the client's question (cancellation, payment, insurance).
- **Vaccine schedules** — retrieve the vaccination protocol for the specific species/breed/age.

```typescript
// Retrieve relevant context before calling the LLM:
const relevantProducts = await vectorDB.search(userQuery, { collection: 'products', limit: 5 });
const relevantArticles = await vectorDB.search(userQuery, { collection: 'pet_care', limit: 3 });

const result = streamText({
  model,
  prompt: vetPrompt({
    clinicInfo: CLINIC_INFO,
    conversationHistory: history,
    latestQuestion: userQuery,
    retrievedContext: `
      <relevant-products>
      ${relevantProducts.map(p => `- ${p.name}: $${p.price} - ${p.description}`).join('\n')}
      </relevant-products>
      <relevant-articles>
      ${relevantArticles.map(a => `${a.title}: ${a.content}`).join('\n')}
      </relevant-articles>
    `,
  }),
});
```

**How to improve:**
- Build a **vector database** (Pinecone, pgvector, Chroma) with your product catalog, pet care articles, and clinic FAQs.
- Embed and index your content once; query it per request.
- Use **hybrid search** (semantic + keyword) for product lookups — "Royal Canin puppy food" needs exact brand matching.
- Cache retrieval results for common queries.

---

### 5. Chain of Thought (05.05)

**What it is:** Adding `<thinking-instructions>` to the prompt that tell the LLM to reason step-by-step before answering. Improves accuracy for complex reasoning.

**Where it applies:**
- **Scheduling conflicts:** "Can I book Luna for grooming AND a vaccine on the same day?" — the LLM needs to check both services' durations, find overlapping availability, and propose a sequence.
- **Product recommendations:** "I have a 3-month-old kitten with sensitive stomach, what food should I buy?" — the LLM needs to consider age, species, condition, available brands, and price range.
- **Triage:** "My dog ate chocolate 2 hours ago" — the LLM needs to assess urgency, consider the time factor, and decide between "emergency" and "call us."

```typescript
<thinking-instructions>
  Before answering, consider:
  1. What specific information does the client need?
  2. Do I have enough context (pet name, species, dates)?
  3. Is this urgent (emergency symptoms)?
  4. What's the most helpful next step I can offer?
  Think through these steps before responding.
</thinking-instructions>
```

**How to improve:**
- Use chain-of-thought for **complex multi-step requests** only — it adds latency and tokens for simple FAQ queries.
- Consider using the model's native thinking capability (Gemini's thinking mode) instead of manual CoT when available.

---

## Architecture Impact

```
Client message arrives
  │
  ├── 1. Classify intent (basic prompting + exemplars)
  │     → book_appointment | grooming | product | emergency | faq
  │
  ├── 2. Retrieve relevant context (RAG)
  │     ├── Product catalog (if product inquiry)
  │     ├── Pet care articles (if health question)
  │     ├── Clinic policies (if policy question)
  │     └── Vaccine schedules (if vaccine inquiry)
  │
  ├── 3. Assemble prompt (template)
  │     ├── <task-context> (fixed)
  │     ├── <background-data> (clinic info + retrieved context)
  │     ├── <rules> (fixed)
  │     ├── <examples> (exemplars for current intent)
  │     ├── <conversation-history> (from persistence)
  │     ├── <the-ask> (current message)
  │     └── <thinking-instructions> (only for complex queries)
  │
  └── 4. Stream response
```

---

## Quick Checklist: Is Chapter 5 Fully Applied?

- [ ] Prompt follows the structured template (task-context, tone, background, rules, examples, ask)
- [ ] System prompt is a function, not a static string (accepts dynamic data)
- [ ] Exemplars defined for each intent category (2-5 per category)
- [ ] Retrieval system in place for: products, pet care articles, clinic policies
- [ ] Retrieved context injected as `<background-data>` in the prompt
- [ ] Chain-of-thought used for complex reasoning (scheduling, triage, recommendations)
- [ ] Chat title generation uses the basic prompting pattern
- [ ] Exemplars updated from real conversations over time
