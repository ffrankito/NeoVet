import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { botBusinessContext } from "@/db/schema";

const contextId = (key: string) => `bbc_${key.replace(/[^a-z0-9]/g, "_")}`;

const INITIAL_CONTEXT = [
  { id: contextId("horarios_semana"), key: "horarios_semana", label: "Horarios de lunes a sábado", value: "Lunes a sábado: 9:30 a 12:30 hs y 16:30 a 20:00 hs", category: "horarios" as const },
  { id: contextId("horarios_feriados"), key: "horarios_feriados", label: "Horarios feriados", value: "Feriados: 10:00 a 13:00 hs", category: "horarios" as const },
  { id: contextId("horarios_domingo"), key: "horarios_domingo", label: "Horarios domingos", value: "Domingos: guardia pasiva 9:00 a 20:00 hs. Llamar para consultar atención.", category: "horarios" as const },
  { id: contextId("guardia_obstetrica"), key: "guardia_obstetrica", label: "Guardia obstétrica", value: "Guardia obstétrica disponible las 24hs", category: "horarios" as const },
  { id: contextId("telefono"), key: "telefono", label: "Teléfono / WhatsApp", value: "+54 9 341 310-1194", category: "contacto" as const },
  { id: contextId("direccion"), key: "direccion", label: "Dirección", value: "Morrow 4064, Rosario, Santa Fe", category: "contacto" as const },
  { id: contextId("email"), key: "email", label: "Email", value: "veterinarianeo@gmail.com", category: "contacto" as const },
  { id: contextId("faq_turnos"), key: "faq_turnos", label: "¿Cómo saco un turno?", value: "Los turnos se sacan por WhatsApp al +54 9 341 310-1194 o directamente desde el chat.", category: "faq" as const },
  { id: contextId("faq_emergencias"), key: "faq_emergencias", label: "¿Qué hago ante una emergencia?", value: "Ante una emergencia comunicarse directamente por WhatsApp al +54 9 341 310-1194. Guardia obstétrica disponible 24hs.", category: "faq" as const },
  { id: contextId("faq_precios"), key: "faq_precios", label: "¿Cuáles son los precios?", value: "Los precios varían según el servicio y el tamaño de la mascota. Consultanos por WhatsApp para valores actualizados.", category: "faq" as const },
  { id: contextId("especialidades"), key: "especialidades", label: "Especialidades", value: "Ecografía de alta complejidad en consultorio y a domicilio, razas braquicefálicas, reproducción y neonatología.", category: "servicios" as const },
];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let inserted = 0;
  for (const item of INITIAL_CONTEXT) {
    const result = await db
      .insert(botBusinessContext)
      .values(item)
      .onConflictDoNothing();
    inserted++;
  }

  return NextResponse.json({ ok: true, inserted });
}