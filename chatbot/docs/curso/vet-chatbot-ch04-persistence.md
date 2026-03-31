# Ch 04 — Persistence: Vet Chatbot Reference

> **Purpose:** Save conversations so clients can return, and so the clinic has a record of every interaction.

---

## Business Context Reminder

Veterinary clinic + petshop + grooming. Returning clients expect the bot to remember their pets. The clinic needs conversation logs for accountability and follow-up.

---

## Chapter 4 Concepts — Where They Apply

### 1. `onFinish` Callback (04.01)

**What it is:** Two `onFinish` hooks — one on `streamText()` (gives you `ModelMessage[]`) and one on `toUIMessageStreamResponse()` (gives you `UIMessage[]` including the full history). These fire after the stream completes.

**Where it applies:**
- **Save every bot response** to your database after the stream finishes.
- `streamText.onFinish` gives raw model messages — useful for debugging/logging.
- `toUIMessageStreamResponse.onFinish` gives the full UI message list — this is what you persist.

**How to improve:**
- Use `onFinish` to also trigger **side effects**: send a confirmation email after booking, update the CRM after collecting client info, notify the receptionist of urgent requests.

```typescript
return result.toUIMessageStreamResponse({
  originalMessages: messages,
  onFinish: async ({ messages, responseMessage }) => {
    // Persist the full conversation
    await db.saveMessages(chatId, messages);
    
    // Side effect: if appointment was booked, send confirmation SMS
    if (containsBookingConfirmation(responseMessage)) {
      await smsService.sendConfirmation(clientPhone, appointmentDetails);
    }
  },
});
```

---

### 2. Chat ID from Client (04.02)

**What it is:** The frontend generates a unique `id` per conversation and sends it with every request. The server uses this to group messages into conversations.

**Where it applies:**
- Each chat widget session gets a unique ID.
- If the client closes the browser and returns, the same ID loads their previous conversation.
- Multiple clients chatting simultaneously each have their own isolated conversation.

**How to improve:**
- Generate IDs on the frontend with `crypto.randomUUID()`.
- Store the chat ID in `localStorage` so returning visitors resume their conversation.
- For authenticated users, associate the chat ID with their account in your database.

```typescript
// Frontend:
const { messages, sendMessage } = useChat({
  chatId: existingChatId || crypto.randomUUID(),
  // Pass chatId to server with every request
});
```

---

### 3. Persistence Layer (04.03)

**What it is:** A full CRUD layer for conversations. `createChat()`, `getChat()`, `appendToChatMessages()`, `deleteChat()`. The course uses a JSON file; production uses a real database.

**Where it applies:**
- **Create** a new chat when a client starts a conversation.
- **Append** messages as they arrive (both user messages and bot responses).
- **Get** chat history when the page loads to restore the conversation.
- **Delete** old conversations per data retention policy.

**Server-side pattern:**

```typescript
export const POST = async (req: Request) => {
  const { messages, id } = await req.json();

  let chat = await getChat(id);
  const mostRecentMessage = messages[messages.length - 1];

  if (!chat) {
    chat = await createChat(id, messages);
  } else {
    await appendToChatMessages(id, [mostRecentMessage]);
  }

  const result = streamText({ model, messages: await convertToModelMessages(messages) });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      await appendToChatMessages(id, [responseMessage]);
    },
  });
};

// GET endpoint to load existing chat
export const GET = async (req: Request) => {
  const chatId = new URL(req.url).searchParams.get('chatId');
  const chat = await getChat(chatId);
  return Response.json(chat);
};
```

**How to improve for the vet chatbot:**
- Add a `clientId` field to link conversations to client accounts.
- Add a `petId` field so you can pull up all conversations about a specific pet.
- Add a `status` field: `active`, `resolved`, `escalated`.
- Implement **conversation expiry**: auto-close chats after 24h of inactivity.

---

### 4. Normalized Database Schema (04.04)

**What it is:** Instead of storing messages as a JSON blob, normalize into proper tables: `chats`, `messages`, `parts`. Each message part (text, tool call, tool result, data) gets its own row with typed columns.

**Where it applies:**
- Production-grade storage for the vet chatbot.
- Enables **querying**: "Show me all conversations where a grooming appointment was booked last week."
- Enables **analytics**: "How many tool calls per conversation on average?"

**Recommended schema for the vet chatbot:**

```
chats
  ├── id (PK)
  ├── clientId (FK → clients)
  ├── status (active | resolved | escalated)
  ├── createdAt
  └── updatedAt

messages
  ├── id (PK)
  ├── chatId (FK → chats)
  ├── role (user | assistant)
  ├── createdAt
  └── order

parts
  ├── id (PK)
  ├── messageId (FK → messages)
  ├── type (text | tool-checkAvailability | tool-createAppointment | ...)
  ├── order
  ├── text_text (for text parts)
  ├── tool_toolCallId
  ├── tool_state (partial | result)
  ├── tool_checkAvailability_input (jsonb)
  ├── tool_checkAvailability_output (jsonb)
  ├── tool_createAppointment_input (jsonb)
  ├── tool_createAppointment_output (jsonb)
  └── ...
```

**How to improve:**
- Add **database constraints** (CHECK) to ensure required fields per part type.
- Add **indexes** on `chatId`, `chatId + createdAt`, and `messageId + order` for fast queries.
- Use Drizzle ORM (as taught in the course) for type-safe queries.
- Implement a **mapping layer** to convert between DB rows ↔ `UIMessage[]`.

---

### 5. Validating Messages (04.05)

**What it is:** `validateUIMessages()` from the AI SDK checks that incoming messages conform to the expected format. Catches malformed or tampered messages before they reach the LLM.

**Where it applies:**
- **Every POST request** should validate messages before processing.
- Protects against: malformed JSON, missing required fields, injection attempts, corrupted client-side state.

```typescript
let messages: UIMessage[];
try {
  messages = await validateUIMessages({ messages: body.messages });
} catch (error) {
  return new Response('Invalid messages', { status: 400 });
}
```

**How to improve:**
- Add **custom validation** on top: check that `role` alternates correctly, message count is within limits.
- Log validation failures — they might indicate a bug in the frontend or an attack attempt.

---

## Architecture Impact

```
Client opens chat widget
  ├── Check localStorage for existing chatId
  │     ├── Found → GET /api/chat?chatId=xxx → Load conversation history
  │     └── Not found → Generate new chatId
  │
  ├── User sends message
  │     └── POST /api/chat { id, messages }
  │           ├── validateUIMessages()
  │           ├── getChat(id) || createChat(id, messages)
  │           ├── appendToChatMessages(id, [userMessage])
  │           ├── streamText() → stream to client
  │           └── onFinish → appendToChatMessages(id, [botResponse])
  │                        → trigger side effects (email, SMS, CRM update)
  │
  └── Data lives in:
        chats → messages → parts (normalized, queryable)
```

---

## Quick Checklist: Is Chapter 4 Fully Applied?

- [ ] `onFinish` saves every bot response to the database
- [ ] Chat ID generated on frontend, sent with every request
- [ ] `createChat` / `getChat` / `appendToChatMessages` persistence layer implemented
- [ ] GET endpoint loads existing chat history on page load
- [ ] `validateUIMessages()` called before processing every request
- [ ] Database schema normalized (chats → messages → parts) for production
- [ ] Conversations linked to client accounts (`clientId`)
- [ ] Data retention policy defined (auto-delete after N days)
- [ ] Side effects triggered in `onFinish` (confirmations, notifications)
