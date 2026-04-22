import { createClient } from "@supabase/supabase-js";
import type { Message } from "./agent";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_TIMEOUT_MINUTES = 60;

export type ConversationSession = {
  conversationId: string;
  messages: Message[];
};

function generateId(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const random = Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `${prefix}_${random}`;
}

export async function getOrCreateSession(
  phone: string
): Promise<ConversationSession> {
  // 1. Buscar o crear contacto
  const { data: contact } = await supabase
    .from("bot_contacts")
    .select("id")
    .eq("phone", phone)
    .single();

  let contactId: string;

  if (!contact) {
    const { data: newContact, error } = await supabase
      .from("bot_contacts")
      .insert({ id: generateId("cnt"), phone, name: null })
      .select("id")
      .single();

    if (error || !newContact) throw new Error(`Error creando contacto: ${error?.message}`);
    contactId = newContact.id;
  } else {
    contactId = contact.id;
  }

  // 2. Buscar conversación activa reciente
  const timeoutAgo = new Date(
    Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000
  ).toISOString();

  const { data: activeConv } = await supabase
    .from("bot_conversations")
    .select("id")
    .eq("contact_id", contactId)
    .eq("status", "active")
    .eq("channel", "whatsapp")
    .gte("updated_at", timeoutAgo)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  let conversationId: string;

  if (!activeConv) {
    const { data: newConv, error } = await supabase
      .from("bot_conversations")
      .insert({
        id: generateId("conv"),
        contact_id: contactId,
        status: "active",
        urgency_level: 1,
        channel: "whatsapp",
      })
      .select("id")
      .single();

    if (error || !newConv) throw new Error(`Error creando conversación: ${error?.message}`);
    conversationId = newConv.id;
  } else {
    conversationId = activeConv.id;
  }

  // 3. Cargar historial
  const { data: rawMessages } = await supabase
    .from("bot_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages: Message[] = (rawMessages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return { conversationId, messages };
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await supabase.from("bot_messages").insert({
    id: generateId("msg"),
    conversation_id: conversationId,
    role,
    content,
  });

  await supabase
    .from("bot_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function escalateConversation(
  conversationId: string
): Promise<void> {
  await supabase
    .from("bot_conversations")
    .update({ status: "escalated", urgency_level: 4 })
    .eq("id", conversationId);
}