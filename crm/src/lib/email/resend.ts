import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local to send email.",
    );
  }
  client = new Resend(key);
  return client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
// En producción reemplazar por: "turnos@neovet.com.ar" o el dominio verificado