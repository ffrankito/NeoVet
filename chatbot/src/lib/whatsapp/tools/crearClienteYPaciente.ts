import { tool } from "ai";
import { z } from "zod";

const CRM_URL = process.env.CRM_URL!;
const BOT_API_KEY = process.env.BOT_API_KEY!;

/**
 * Factory: `senderPhone` is the WhatsApp conversation's verified sender.
 * The model cannot specify the phone — it is locked to the conversation
 * so the bot can't be tricked into registering someone else's number.
 */
export function createCrearClienteYPaciente(senderPhone: string) {
  return tool({
    description:
      "Crea un cliente nuevo con su mascota en el CRM, registrado con el " +
      "número de WhatsApp del remitente. Usá esta herramienta solo cuando " +
      "tenés TODOS los datos completos. Devuelve clientId y patientId.",
    parameters: z.object({
      ownerName: z.string().describe("Nombre completo del dueño"),
      ownerDni: z.string().describe("DNI del dueño, solo números"),
      petName: z.string().describe("Nombre de la mascota"),
      petSpecies: z
        .enum(["canine", "feline", "other"])
        .describe("canine = perro, feline = gato"),
      petBreed: z.string().optional().describe("Raza de la mascota"),
      petSex: z
        .enum(["macho", "hembra", "desconocido"])
        .describe("Sexo de la mascota"),
      petDateOfBirth: z
        .string()
        .optional()
        .describe("Fecha de nacimiento en formato YYYY-MM-DD"),
    }),
    execute: async ({
      ownerName,
      ownerDni,
      petName,
      petSpecies,
      petBreed,
      petSex,
      petDateOfBirth,
    }) => {
      const res = await fetch(`${CRM_URL}/api/bot/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${BOT_API_KEY}`,
        },
        body: JSON.stringify({
          name: ownerName,
          phone: senderPhone,
          dni: ownerDni,
          source: "whatsapp",
          patient: {
            name: petName,
            species: petSpecies,
            breed: petBreed ?? null,
            sex: petSex,
            dateOfBirth: petDateOfBirth ?? null,
          },
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(
          `Error creando cliente: ${res.status} — ${JSON.stringify(error)}`,
        );
      }
      return await res.json();
    },
  });
}
