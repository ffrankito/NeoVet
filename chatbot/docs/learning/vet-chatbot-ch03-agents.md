# Ch 03 — Agents: Vet Chatbot Reference

> **Purpose:** Give the chatbot the ability to *act* — not just talk. Tools let the LLM call your booking system, check inventory, and query the calendar on behalf of the client.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. The chatbot needs to go beyond Q&A and actually perform actions: book appointments, check availability, look up products, manage client records.

---

## Chapter 3 Concepts — Where They Apply

### 1. Tool Calling (03.01)

**What it is:** You define `tool()` objects with a Zod schema (`inputSchema`) and an `execute` function. The LLM decides *when* to call a tool and *what arguments* to pass. The SDK runs the function and feeds the result back to the LLM.

**Where it applies:** This is the **core capability** that turns your chatbot from a FAQ bot into a functional assistant.

**Key tools for the vet chatbot:**

```typescript
tools: {
  checkAvailability: tool({
    description: 'Check available appointment slots for a given date and service type',
    inputSchema: z.object({
      date: z.string().describe('Date in YYYY-MM-DD format'),
      serviceType: z.enum(['vet_consultation', 'vaccine', 'surgery', 'grooming_bath', 'grooming_haircut', 'grooming_nails']),
      petSize: z.enum(['small', 'medium', 'large']).optional(),
    }),
    execute: async ({ date, serviceType, petSize }) => {
      return await calendarAPI.getAvailableSlots(date, serviceType, petSize);
    },
  }),

  createAppointment: tool({
    description: 'Book an appointment for a client',
    inputSchema: z.object({
      clientName: z.string(),
      clientPhone: z.string(),
      petName: z.string(),
      petSpecies: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
      date: z.string(),
      time: z.string(),
      serviceType: z.string(),
    }),
    execute: async (params) => {
      return await bookingAPI.createAppointment(params);
    },
  }),

  searchProducts: tool({
    description: 'Search the petshop product catalog',
    inputSchema: z.object({
      query: z.string().describe('Product name, brand, or category'),
      petType: z.enum(['dog', 'cat', 'bird', 'rabbit', 'all']).optional(),
    }),
    execute: async ({ query, petType }) => {
      return await inventoryAPI.search(query, petType);
    },
  }),

  getClientHistory: tool({
    description: 'Look up a client and their pets by phone number',
    inputSchema: z.object({
      phone: z.string(),
    }),
    execute: async ({ phone }) => {
      return await crmAPI.getClientByPhone(phone);
    },
  }),
}
```

**How to improve:**
- Write **precise `description`** fields — the LLM uses these to decide *when* to invoke each tool.
- Add `.describe()` to every Zod field so the LLM knows what format to use.
- Return structured results from `execute` (not just strings) so the LLM can reason about them.

---

### 2. Message Parts (03.02)

**What it is:** Messages aren't just text — they contain typed `parts` (text, tool calls, tool results). Each part has a `type` field the frontend can switch on.

**Where it applies:**
- When the bot calls `checkAvailability`, the message stream includes a `tool-call` part followed by a `tool-result` part.
- Your frontend can inspect these parts to render appropriate UI.

**How to improve:**
- Log tool call parts for analytics — track which tools are called most (booking vs product search vs FAQ).
- Use parts to build an **audit trail** of every action the bot took during a conversation.

---

### 3. Showing Tools in the Frontend (03.03)

**What it is:** Instead of hiding tool calls, render them as visual elements in the chat. Each tool type gets its own component.

**Where it applies in the vet chatbot:**

```typescript
// In your Message component:
if (part.type === 'tool-checkAvailability') {
  return <AvailabilityCard slots={part.output?.slots} date={part.input?.date} />;
}
if (part.type === 'tool-createAppointment') {
  return <BookingConfirmation appointment={part.output} />;
}
if (part.type === 'tool-searchProducts') {
  return <ProductGrid products={part.output?.results} />;
}
```

**How to improve:**
- Show a **loading spinner** with context: "Checking availability for Friday..." while the tool executes.
- After `createAppointment` succeeds, show a **confirmation card** with date, time, service, and a "Add to Calendar" button.
- For `searchProducts`, render a **product carousel** with images, prices, and "Add to cart" buttons.

---

### 4. ToolLoopAgent (03.04)

**What it is:** `ToolLoopAgent` wraps the tool-calling pattern into a reusable class. It auto-loops: calls tools, feeds results back to the LLM, and repeats until the LLM stops requesting tools. Uses `createAgentUIStreamResponse` instead of manual wiring.

**Where it applies:**
- Complex booking flows: "Book Luna for grooming AND a vaccine on the same day" requires multiple tool calls (check availability for both, find overlapping slots, book both).
- Product recommendations: search, filter by pet type, check stock, suggest alternatives.

**How to improve:**
- Use `stepCountIs(N)` as a **safety limit** — prevent the agent from looping endlessly. For the vet chatbot, `stepCountIs(5)` is reasonable.
- The agent pattern is cleaner than manually wiring `streamText` + tools for multi-step flows.

```typescript
const agent = new ToolLoopAgent({
  model: google('gemini-2.5-flash'),
  instructions: VET_SYSTEM_PROMPT,
  tools: vetTools,
});

// In the POST handler:
return createAgentUIStreamResponse({
  agent,
  uiMessages: messages,
});
```

---

### 5. MCP via stdio / HTTP (03.05–03.06)

**What it is:** Model Context Protocol (MCP) lets you connect to external tool servers. Instead of defining tools inline, you import them from an MCP server. `stdio` runs a local process; HTTP connects to a remote server.

**Where it applies:**
- Connect to your **existing clinic management software** if it exposes an MCP server.
- Connect to **third-party services**: Google Calendar MCP for scheduling, a payment MCP for invoicing.
- If you build your vet tools as an MCP server, *any* AI client can use them — not just your chatbot.

**How to improve:**
- Build your vet clinic tools as an **MCP server** — this makes them reusable across chatbot, internal admin tools, and future AI agents.
- Close MCP clients in `onFinish` to avoid resource leaks (as shown in the course).

```typescript
const mcpClient = await createMCPClient({
  transport: new StdioMCPTransport({
    command: 'node',
    args: ['./vet-clinic-mcp-server.js'],
  }),
});

const result = streamText({
  model: google('gemini-2.5-flash'),
  tools: await mcpClient.tools(),
  stopWhen: [stepCountIs(10)],
});
```

---

### 6. Tool Approval (03.07)

**What it is:** Some tools shouldn't execute automatically — they need human confirmation first. The LLM proposes the tool call, but execution waits for the user to approve.

**Where it applies — critical for the vet chatbot:**
- **`createAppointment`** — ALWAYS require approval. "I'd like to book Luna for a bath on Friday at 2pm. Should I confirm?"
- **`cancelAppointment`** — ALWAYS require approval. Accidental cancellations are costly.
- **`checkAvailability`** — auto-execute (read-only, no side effects).
- **`searchProducts`** — auto-execute (read-only).

**How to improve:**
- Classify tools as **read-only** (auto-execute) vs **write** (require approval).
- Show the user a **confirmation card** with all details before executing write tools.
- Add a "Cancel" button so users can abort before confirmation.

---

## Architecture Impact

```
Client asks: "Can I book Luna for a bath this Friday?"

Bot (internally):
  1. Calls checkAvailability({ date: "2026-04-03", serviceType: "grooming_bath" })
     → Returns: [{ time: "10:00", available: true }, { time: "14:00", available: true }]
  
  2. Responds: "Friday has openings at 10am and 2pm. Which works for you?"

Client: "2pm please, my name is María, phone 555-1234"

Bot (internally):
  3. Calls createAppointment({...}) → WAITS FOR APPROVAL
  4. Shows confirmation card: "Book Luna (dog) for bath, Fri Apr 3 at 2pm?"

Client: [Clicks Confirm]

  5. Executes → Returns: { success: true, confirmationId: "APT-4521" }
  6. Responds: "All set! Luna's bath is confirmed for Friday at 2pm. Confirmation: APT-4521"
```

---

## Quick Checklist: Is Chapter 3 Fully Applied?

- [ ] Core tools defined: `checkAvailability`, `createAppointment`, `cancelAppointment`, `searchProducts`, `getClientHistory`
- [ ] Every tool has precise `description` and `.describe()` on all Zod fields
- [ ] Tool results rendered as rich UI components (availability cards, booking confirmations, product grids)
- [ ] `ToolLoopAgent` or `stopWhen: [stepCountIs(N)]` used for multi-step flows
- [ ] Write tools (book, cancel) require user approval before execution
- [ ] Read tools (search, check) auto-execute
- [ ] MCP considered for reusable tool packaging
- [ ] Tool call analytics logged (which tools, how often, success rate)
