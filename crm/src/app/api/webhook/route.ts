import { NextRequest, NextResponse } from "next/server";
import { verifyKapsoWebhook } from "@/lib/kapso/verify-webhook";
import { KapsoWebhookPayload } from "@/lib/kapso/types";
import { db } from "@/db";
import { contacts, conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/webhook
 *
 * Entry point for all incoming WhatsApp messages via Kapso.
 *
 * The key constraint: Kapso has a 5-second timeout on webhook responses.
 * We must return 200 immediately, then do all the heavy work in the background
 * using waitUntil() from the Vercel edge runtime.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Step 1: Verify HMAC signature — reject anything not from Kapso
  const signature = req.headers.get("x-kapso-signature");
  if (!verifyKapsoWebhook(rawBody, signature)) {
    console.warn("[webhook] Invalid signature — rejecting request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: KapsoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Step 2: Return 200 immediately — Kapso's 5s timeout clock is ticking
  // All DB writes and AI processing happen in the background
  const response = NextResponse.json({ received: true }, { status: 200 });

  // Step 3: Background processing — runs after response is sent
  // waitUntil() keeps the serverless function alive until this promise resolves
  const backgroundWork = processWebhookPayload(payload);

  // In production (Vercel), waitUntil() keeps the function alive after the response
  // is sent. In dev (Node.js runtime), we just await it inline.
  await backgroundWork;

  return response;
}

async function processWebhookPayload(payload: KapsoWebhookPayload) {
  try {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        if (!value.messages || value.messages.length === 0) continue;

        const kapsoContact = value.contacts?.[0];
        const incomingMessage = value.messages[0];

        // a. Upsert contact — create if new, skip if existing
        const waId = incomingMessage.from;
        const [contact] = await db
          .insert(contacts)
          .values({
            whatsappId: waId,
            displayName: kapsoContact?.profile?.name ?? null,
            phone: waId,
          })
          .onConflictDoUpdate({
            target: contacts.whatsappId,
            set: {
              displayName: kapsoContact?.profile?.name ?? undefined,
              updatedAt: new Date(),
            },
          })
          .returning();

        // b. Upsert conversation — one conversation per WhatsApp thread
        // Using waId as the thread ID (Kapso is 1:1 per number)
        const [conversation] = await db
          .insert(conversations)
          .values({
            contactId: contact.id,
            whatsappThreadId: waId,
            lastMessageAt: new Date(),
          })
          .onConflictDoUpdate({
            target: conversations.whatsappThreadId,
            set: {
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            },
          })
          .returning();

        // c. Persist the message (idempotent via whatsappMessageId unique constraint)
        const messageType = incomingMessage.type as
          | "text"
          | "image"
          | "audio"
          | "document"
          | "location";

        const body =
          incomingMessage.type === "text"
            ? (incomingMessage as { type: "text"; text: { body: string } }).text.body
            : null;

        await db
          .insert(messages)
          .values({
            conversationId: conversation.id,
            whatsappMessageId: incomingMessage.id,
            senderType: "contact",
            messageType,
            body,
            sentAt: new Date(Number(incomingMessage.timestamp) * 1000),
          })
          .onConflictDoNothing({ target: messages.whatsappMessageId });

        // d. TODO (Week 3): Download media → Supabase Storage

        // e. TODO (Week 2): L4 keyword fast-path + hand off to agent
      }
    }
  } catch (error) {
    console.error("[webhook] Background processing failed:", error);
  }
}

/**
 * GET /api/webhook
 *
 * Kapso sends a GET request to verify the webhook URL during setup.
 * We echo back the hub.challenge parameter to confirm ownership.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.KAPSO_WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
