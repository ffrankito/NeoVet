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

function verifyKapsoSignature(req: NextRequest): boolean {
  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  if (!secret) return true; // en dev sin secreto configurado dejamos pasar

  const signature = req.headers.get("x-kapso-signature");
  return signature === secret;
}

type KapsoWebhookPayload = {
  messageId: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  type: "text" | "image" | "document" | "audio";
};

export async function POST(req: NextRequest) {
  // 1. Verificar firma de Kapso
  if (!verifyKapsoSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parsear body
  let body: KapsoWebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { from, text, messageId } = body;

  if (!from || !text || !messageId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phone = from.replace(/\D/g, "");
  const userMessage = text.trim();

  try {
    // 3. Detección L4 pre-AI
    if (isL4Emergency(userMessage)) {
      const session = await getOrCreateSession(phone);
      await saveMessage(session.conversationId, "user", userMessage);
      await saveMessage(session.conversationId, "assistant", L4_RESPONSE);
      await escalateConversation(session.conversationId);
      return NextResponse.json({ reply: L4_RESPONSE });
    }

    // 4. Obtener sesión y historial
    const session = await getOrCreateSession(phone);

    // 5. Guardar mensaje entrante
    await saveMessage(session.conversationId, "user", userMessage);

    // 6. Construir historial para el agente
    const messages = [
      ...session.messages,
      { role: "user" as const, content: userMessage },
    ];

    // 7. Correr el agente
    const reply = await runWhatsappAgent(messages, phone);

    // 8. Guardar respuesta
    await saveMessage(session.conversationId, "assistant", reply);

    // 9. Responder a Kapso
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("[whatsapp/webhook] Error:", error);

    const fallback =
      "Disculpá, tuve un problema técnico. " +
      "Podés escribirnos directamente al *+54 9 341 310-1194* y te atendemos enseguida.";

    // Devolvemos 200 para que Kapso no reintente y no duplique mensajes
    return NextResponse.json({ reply: fallback }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "NeoVet WhatsApp Bot" });
}