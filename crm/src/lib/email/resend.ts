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

export function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not set. Configure it in Vercel (production) or .env.local (dev). Use the verified Resend domain (e.g. \"NeoVet <turnos@neovet.com.ar>\").",
    );
  }
  return from;
}