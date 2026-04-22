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
): Promise<{ status: number; body: string }> {
  const res = await fetch(
    `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.KAPSO_API_KEY!,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    }
  );

  const responseBody = await res.text();
  return { status: res.status, body: responseBody };
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

  if (!phone || !userMessage || !messageId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    if (isL4Emergency(userMessage)) {
      const session = await getOrCreateSession(phone);
      await saveMessage(session.conversationId, "user", userMessage);
      await saveMessage(session.conversationId, "assistant", L4_RESPONSE);
      await escalateConversation(session.conversationId);
      const r = await sendWhatsappReply(body.message.from, L4_RESPONSE, phoneNumberId);
      return NextResponse.json({ reply: L4_RESPONSE, kapsoStatus: r.status, kapsoBody: r.body });
    }

    const session = await getOrCreateSession(phone);
    await saveMessage(session.conversationId, "user", userMessage);

    const messages = [
      ...session.messages,
      { role: "user" as const, content: userMessage },
    ];

    const reply = await runWhatsappAgent(messages, phone);
    await saveMessage(session.conversationId, "assistant", reply);

    const kapsoResult = await sendWhatsappReply(body.message.from, reply, phoneNumberId);

    return NextResponse.json({
      reply,
      kapsoStatus: kapsoResult.status,
      kapsoBody: kapsoResult.body,
    });

  } catch (error) {
    console.error("[webhook] Error:", error);

    const fallback =
      "Disculpá, tuve un problema técnico. " +
      "Podés escribirnos directamente al *+54 9 341 310-1194* y te atendemos enseguida.";

    const r = await sendWhatsappReply(body.message.from, fallback, phoneNumberId).catch(() => ({ status: 0, body: "error" }));

    return NextResponse.json({ reply: fallback, kapsoStatus: r.status, kapsoBody: r.body }, { status: 200 });
  }
}