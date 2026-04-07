# Ch 06 — Evals: Vet Chatbot Reference

> **Purpose:** Measure whether your chatbot is actually good. Without evals, you're flying blind — prompt changes might improve one case and break ten others.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. The chatbot must give accurate prices, correctly identify emergencies, book the right services, and never give medical diagnoses. Getting any of these wrong has real consequences.

---

## Chapter 6 Concepts — Where They Apply

### 1. Evalite Basics (06.01)

**What it is:** The `evalite` framework lets you define test datasets, run your LLM pipeline against them, and score the outputs. Structure: `data()` returns test cases, `task()` runs the pipeline, `scorers` evaluate the result.

**Where it applies:** Every critical behavior of the vet chatbot should have an eval.

```typescript
evalite('Emergency Detection', {
  data: () => [
    { input: 'My dog ate rat poison 30 minutes ago', expected: 'emergency' },
    { input: 'My cat has been vomiting blood', expected: 'emergency' },
    { input: 'My dog has a small scratch on his paw', expected: 'non_emergency' },
    { input: 'When is my next appointment?', expected: 'non_emergency' },
  ],
  task: async (input) => {
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: VET_SYSTEM_PROMPT,
      prompt: input,
    });
    return result.text;
  },
  scorers: [/* ... */],
});
```

**How to improve:**
- Create evals for **every critical path**: emergency detection, intent classification, price accuracy, booking flow, refusal to diagnose.
- Run evals automatically before deploying prompt changes.

---

### 2. Deterministic Eval (06.02)

**What it is:** Scorers that check concrete, measurable properties — string includes, length limits, regex matches, format checks. No LLM involved in scoring.

**Where it applies:**

```typescript
scorers: [
  {
    name: 'Contains Emergency Number',
    scorer: ({ output }) => {
      return output.includes('555-EMERGENCY') ? 1 : 0;
    },
  },
  {
    name: 'Does Not Diagnose',
    scorer: ({ output }) => {
      const diagnosisPatterns = /you (have|probably have|might have|likely have|seem to have)/i;
      return diagnosisPatterns.test(output) ? 0 : 1;
    },
  },
  {
    name: 'Response Length',
    scorer: ({ output }) => {
      return output.length < 500 ? 1 : 0;
    },
  },
  {
    name: 'Includes Price When Asked',
    scorer: ({ input, output }) => {
      if (input.toLowerCase().includes('price') || input.toLowerCase().includes('cost')) {
        return /\$\d+/.test(output) ? 1 : 0;
      }
      return 1; // Not applicable
    },
  },
]
```

**How to improve:**
- Deterministic evals are **fast and cheap** — use them as a first pass.
- Check for: emergency number presence, no-diagnosis guardrail, price format, language matching, response length.
- These catch regressions immediately when you change prompts.

---

### 3. LLM-as-a-Judge (06.03)

**What it is:** Use a second LLM to evaluate the first LLM's output. The judge scores on criteria like relevance, accuracy, tone, and attribution. More nuanced than deterministic checks.

**Where it applies:**

```typescript
const empathyScorer = {
  name: 'Empathy and Tone',
  scorer: async ({ input, output }) => {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt: `
        Evaluate this vet clinic chatbot response for empathy and professionalism.
        
        Client message: ${input}
        Bot response: ${output}
        
        Score from 0 to 1:
        - 1: Warm, empathetic, acknowledges the pet owner's concern
        - 0.5: Neutral, professional but cold
        - 0: Dismissive, robotic, or inappropriate for a vet context
      `,
      schema: z.object({
        score: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
    });
    return result.output.score;
  },
};

const accuracyScorer = {
  name: 'Factual Accuracy',
  scorer: async ({ input, output, expected }) => {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt: `
        Given this expected answer and the actual chatbot response, 
        how factually accurate is the response?
        
        Expected: ${expected}
        Actual: ${output}
        
        Score 1 if the key facts match, 0 if there are factual errors.
      `,
      schema: z.object({ score: z.number(), reasoning: z.string() }),
    });
    return result.output.score;
  },
};
```

**How to improve:**
- Use LLM-as-judge for **subjective quality**: tone, helpfulness, completeness.
- Use deterministic scorers for **objective correctness**: prices, phone numbers, hours.
- Combine both in the same eval for comprehensive coverage.

---

### 4. Dataset Management (06.04)

**What it is:** Curating, versioning, and maintaining your eval datasets. Bad data = bad evals = false confidence.

**Where it applies:**
- Build datasets from **real conversations** — export the best and worst interactions from your persistence layer.
- Categorize test cases: emergency, booking, product inquiry, FAQ, edge cases.
- Include **adversarial cases**: prompt injection attempts, off-topic requests, requests for medical diagnosis.

**How to improve:**
- Review and update datasets monthly — as you add services or change prices, test cases must reflect reality.
- Keep at least 5-10 cases per critical category.
- Include **regression cases** — when a bug is found, add it as a test case.

---

### 5. Practical Eval: Chat Title Generation (06.05–06.06)

**What it is:** End-to-end eval for generating concise chat titles. Demonstrates how to combine a task function with multiple scorers and iterate on both the prompt and the dataset.

**Where it applies:**
- Your vet chatbot needs titles for the conversation sidebar: "Luna's Vaccine Booking", "Cat Food Inquiry", "Emergency - Dog Poisoning".
- Eval ensures titles are concise, relevant, and properly formatted.

**How to improve:**
- Critique your own dataset — the course shows how to use an LLM to find gaps and inconsistencies in your test data.

---

### 6. Langfuse Observability (06.07)

**What it is:** Langfuse is an observability platform for LLM apps. Using `experimental_telemetry`, you send traces of every LLM call to Langfuse for monitoring latency, cost, and quality in production.

**Where it applies:**
- **Monitor production conversations** — see exactly what prompts were sent and what responses came back.
- **Track latency** per request — detect if a provider is slow.
- **Track cost** per session — Langfuse aggregates token usage.
- **Debug issues** — when a client reports a bad response, find the exact trace.

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  messages: modelMessages,
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'vet-chat',
    metadata: {
      langfuseTraceId: trace.id,
      sessionId: chatId,
    },
  },
});
```

**How to improve:**
- Add `functionId` labels for each LLM call: `'vet-chat'`, `'title-generation'`, `'intent-classification'`, `'guardrail'`.
- Use `sessionId` (the chat ID) to group all LLM calls in a conversation.
- Set up **Langfuse alerts** for: high latency, high cost, low quality scores.
- Periodically review traces to find cases where the bot underperformed — add those as eval cases.

---

## Architecture Impact

```
Development cycle with evals:

1. Change prompt or logic
2. Run evalite suite
   ├── Emergency detection eval (deterministic)
   ├── Price accuracy eval (deterministic)
   ├── Empathy eval (LLM-as-judge)
   ├── Intent classification eval (deterministic)
   ├── Chat title eval (deterministic + LLM-as-judge)
   └── No-diagnosis guardrail eval (deterministic)
3. All pass? → Deploy
4. Langfuse monitors production
5. Bad traces → New eval cases → Back to step 1
```

---

## Quick Checklist: Is Chapter 6 Fully Applied?

- [ ] Evalite configured and runnable
- [ ] Deterministic scorers for: emergency number, no-diagnosis, price format, response length
- [ ] LLM-as-judge scorers for: empathy/tone, factual accuracy, completeness
- [ ] Eval datasets per category: emergency (5+), booking (5+), products (5+), FAQ (5+), adversarial (5+)
- [ ] Chat title generation eval in place
- [ ] Datasets sourced from real conversations and updated regularly
- [ ] Langfuse (or equivalent) tracing enabled in production
- [ ] Each LLM call labeled with `functionId` and `sessionId`
- [ ] Evals run before every prompt/logic change deployment
