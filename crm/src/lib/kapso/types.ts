// Kapso webhook payload types
// Will be expanded as we add more message types (image, audio, etc.)

export type KapsoMessageType = "text" | "image" | "audio" | "document" | "location";

export interface KapsoContact {
  wa_id: string;       // WhatsApp phone number (e.g. "5491112345678")
  profile: {
    name: string;
  };
}

export interface KapsoTextMessage {
  type: "text";
  text: { body: string };
}

export interface KapsoMediaMessage {
  type: "image" | "audio" | "document";
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename?: string };
}

export interface KapsoLocationMessage {
  type: "location";
  location: { latitude: number; longitude: number; name?: string; address?: string };
}

export type KapsoIncomingMessage = (
  | KapsoTextMessage
  | KapsoMediaMessage
  | KapsoLocationMessage
) & {
  id: string;          // WhatsApp message ID — used for idempotency
  from: string;        // Sender's wa_id
  timestamp: string;   // Unix timestamp string
};

export interface KapsoWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: KapsoContact[];
        messages?: KapsoIncomingMessage[];
        statuses?: unknown[];
      };
      field: "messages";
    }>;
  }>;
}
