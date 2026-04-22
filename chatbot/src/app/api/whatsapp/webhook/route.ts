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
  const res = await fetch("https://api.kapso.app/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KAPSO_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      phone_number_id: phoneNumberId,
      type: "text",
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[kapso] Error enviando mensaje:", res.status, err);
  }
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

  // Solo procesamos mensajes de texto
  if (body.message.type !== "text" || !body.message.text?.body) {
    return NextResponse.json({ ok: true, skipped: "non-text message" });
  }

  const phone = body.message.from.replace(/\D/g, "");
  const userMessage = body.message.text.body.trim();
  const messageId = body.message.id;
  const phoneNumberId = body.phone_number_id;

  if (!phone || !userMessage || !messageId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Detección L4 pre-AI
    if (isL4Emergency(userMessage)) {
      const session = await getOrCreateSession(phone);
      await saveMessage(session.conversationId, "user", userMessage);
      await saveMessage(session.conversationId, "assistant", L4_RESPONSE);
      await escalateConversation(session.conversationId);
      await sendWhatsappReply(body.message.from, L4_RESPONSE, phoneNumberId);
      return NextResponse.json({ reply: L4_RESPONSE });
    }

    // Obtener sesión y historial
    const session = await getOrCreateSession(phone);

    // Guardar mensaje entrante
    await saveMessage(session.conversationId, "user", userMessage);

    // Construir historial para el agente
    const messages = [
      ...session.messages,
      { role: "user" as const, content: userMessage },
    ];

    // Correr el agente
    const reply = await runWhatsappAgent(messages, phone);

    // Guardar respuesta
    await saveMessage(session.conversationId, "assistant", reply);

    // Mandar respuesta a WhatsApp via Kapso
    await sendWhatsappReply(body.message.from, reply, phoneNumberId);

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("[whatsapp/webhook] Error:", error);

    const fallback =
      "Disculpá, tuve un problema técnico. " +
      "Podés escribirnos directamente al *+54 9 341 310-1194* y te atendemos enseguida.";

    await sendWhatsappReply(body.message.from, fallback, phoneNumberId).catch(() => {});

    return NextResponse.json({ reply: fallback }, { status: 200 });
  }
}