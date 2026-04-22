import { NextRequest, NextResponse } from "next/server";
import {
  runWhatsappAgent,
  isL4Emergency,
  L4_RESPONSE,
} from "@/lib/whatsapp/agent";
import {
  getOrCreateSession,
  saveMessage,
  escalateConversation,
} from "@/lib/whatsapp/session";

type KapsoWebhookPayload = {
  test?: boolean;
  message: {
    id: string;
    from: string;
    text?: { body: string };
    type: string;
    timestamp: string;
  };
  conversation: {
    id: string;
    status: string;
  };
  phone_number_id: string;
};

async function sendWhatsappReply(
  to: string,
  message: string,
  phoneNumberId: string
): Promise<void> {
  const body = {
    to,
    phone_number_id: phoneNumberId,
    type: "text",
    text: { body: message },
  };

  console.log("[kapso] Intentando enviar a:", to, "phoneNumberId:", phoneNumberId);
  console.log("[kapso] Body:", JSON.stringify(body));

  const res = await fetch("https://api.kapso.ai/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KAPSO_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log("[kapso] Status:", res.status);
  console.log("[kapso] Response:", responseText);
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "NeoVet WhatsApp Bot" });
}

export async function POST(req: NextRequest) {
  let body: KapsoWebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.message.type !== "text" || !body.message.text?.body) {
    return NextResponse.json({ ok: true, skipped: "non-text message" });
  }

  const phone = body.message.from.replace(/\D/g, "");
  const userMessage = body.message.text.body.trim();
  const messageId = body.message.id;
  const phoneNumberId = body.phone_number_id;

  console.log("[webhook] Mensaje recibido de:", phone, "texto:", userMessage);
  console.log("[webhook] phoneNumberId:", phoneNumberId);

  if (!phone || !userMessage || !messageId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    if (isL4Emergency(userMessage)) {
      const session = await getOrCreateSession(phone);
      await saveMessage(session.conversationId, "user", userMessage);
      await saveMessage(session.conversationId, "assistant", L4_RESPONSE);
      await escalateConversation(session.conversationId);
      await sendWhatsappReply(body.message.from, L4_RESPONSE, phoneNumberId);
      return NextResponse.json({ reply: L4_RESPONSE });
    }

    const session = await getOrCreateSession(phone);
    await saveMessage(session.conversationId, "user", userMessage);

    const messages = [
      ...session.messages,
      { role: "user" as const, content: userMessage },
    ];

    const reply = await runWhatsappAgent(messages, phone);
    console.log("[webhook] Reply del agente:", reply.slice(0, 100));

    await saveMessage(session.conversationId, "assistant", reply);
    await sendWhatsappReply(body.message.from, reply, phoneNumberId);

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("[webhook] Error:", error);

    const fallback =
      "Disculpá, tuve un problema técnico. " +
      "Podés escribirnos directamente al *+54 9 341 310-1194* y te atendemos enseguida.";

    await sendWhatsappReply(body.message.from, fallback, phoneNumberId).catch(() => {});

    return NextResponse.json({ reply: fallback }, { status: 200 });
  }
}