/**
 * NeoVet — Consent Template Seed Script
 *
 * Seeds the 3 default consent document templates:
 *   1. Autorización de cirugía y hospitalización
 *   2. Acta de eutanasia
 *   3. Acuerdo de asesoría reproductiva (GenetiCan 1)
 *
 * Usage:
 *   npx tsx scripts/seed-consent-templates.ts
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts — kept inline to avoid tsconfig path issues)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
    break;
  }
}

// ---------------------------------------------------------------------------
// Template texts
// ---------------------------------------------------------------------------
const SURGERY_TEMPLATE = `Por medio de este documento, yo {{clientName}} ({{clientDni}}) con dirección en {{clientAddress}} en la ciudad de {{clientCity}}.

Extiendo mi completa y total autorización en favor de Neovet, para que lleve a cabo los procedimientos médicos y/o quirúrgicos necesarios para el diagnóstico y tratamiento de: {{procedureDescription}}

en el animal de mi propiedad:

Nombre: {{patientName}}
Especie: {{patientSpecies}}
Raza: {{patientBreed}}
Color de pelaje: {{patientCoatColor}}
Sexo: {{patientSex}}
Edad: {{patientAge}}
Peso: {{patientWeight}} kg

Declaro conocer los riesgos inherentes a la anestesia general y a todo procedimiento quirúrgico, incluyendo la posibilidad de complicaciones graves o muerte del animal. Asumo la responsabilidad de los costos del tratamiento, materiales descartables, medicación e internación que fueran necesarios.

Autorizo a los profesionales de Neovet a realizar los procedimientos que consideren necesarios durante el acto quirúrgico, aun cuando no estuvieran previstos inicialmente, si la salud del paciente así lo requiriese.

Firma del propietario: ______________________
Aclaración: {{clientName}}
DNI: {{clientDni}}
Fecha: {{date}}`;

const EUTHANASIA_TEMPLATE = `Por medio de este documento, yo {{clientName}} ({{clientDni}}) con dirección en {{clientAddress}} en la ciudad de {{clientCity}}.

Siendo propietario del animal:

Nombre: {{patientName}}
Especie: {{patientSpecies}}
Raza: {{patientBreed}}
Sexo: {{patientSex}}
Edad: {{patientAge}}

Diagnóstico: {{diagnosis}}

Autorizo al suscripto Dr./Dra. {{vetName}} con MATRÍCULA N° {{vetLicenseNumber}} a practicar la EUTANASIA del animal mencionado, habiendo sido informado/a de:

1. El estado de salud actual del animal y su pronóstico.
2. Las alternativas terapéuticas disponibles, si las hubiera.
3. Que la eutanasia es un procedimiento irreversible.
4. Que el procedimiento se realizará mediante métodos aprobados que garantizan una muerte humanitaria, sin sufrimiento.

Declaro que esta decisión ha sido tomada de manera libre, voluntaria y consciente, sin mediar presión alguna por parte del profesional veterinario.

Firma del propietario: ______________________
Aclaración: {{clientName}}
DNI: {{clientDni}}
Fecha: {{date}}

Firma del profesional: ______________________
Dr./Dra. {{vetName}}
Matrícula N°: {{vetLicenseNumber}}`;

const REPRODUCTIVE_TEMPLATE = `ACUERDO DE ASESORÍA REPRODUCTIVA — GenetiCan 1

Entre las partes:

Propietario: {{clientName}} (DNI: {{clientDni}})
Domicilio: {{clientAddress}}, {{clientCity}}

y Neovet — Servicio de Asesoría Reproductiva

Respecto del animal:

Nombre: {{patientName}}
Especie: {{patientSpecies}}
Raza: {{patientBreed}}
Sexo: {{patientSex}}
Edad: {{patientAge}}
Peso: {{patientWeight}} kg
Microchip: {{patientMicrochip}}

Se acuerda lo siguiente:

1. OBJETO: El presente acuerdo tiene por objeto la prestación de servicios de asesoría reproductiva integral, que incluye evaluación clínica, estudios complementarios, planificación reproductiva y seguimiento.

2. SERVICIOS INCLUIDOS:
   a) Evaluación clínica reproductiva completa
   b) Estudios de laboratorio pertinentes
   c) Ecografías de seguimiento
   d) Asesoramiento genético de la raza
   e) Plan reproductivo personalizado
   f) Seguimiento gestacional (si aplica)

3. OBLIGACIONES DEL PROPIETARIO:
   a) Cumplir con el calendario de controles establecido
   b) Administrar la medicación indicada según las instrucciones
   c) Informar cualquier cambio en el estado de salud del animal
   d) Asistir a todas las citas programadas

4. LIMITACIÓN DE RESPONSABILIDAD: El servicio de asesoría reproductiva no garantiza resultados específicos de fertilidad o gestación. Los resultados dependen de múltiples factores biológicos que escapan al control profesional.

5. VIGENCIA: Este acuerdo tiene vigencia por el ciclo reproductivo en curso o por un plazo máximo de 12 meses desde la fecha de firma, lo que ocurra primero.

Firma del propietario: ______________________
Aclaración: {{clientName}}
DNI: {{clientDni}}
Fecha: {{date}}

Firma del profesional: ______________________
Neovet — Servicio de Asesoría Reproductiva`;

const SEDATION_TEMPLATE = `Por medio de este documento, yo {{clientName}} ({{clientDni}}) con dirección en {{clientAddress}} en la ciudad de Rosario.

Extiendo mi completa y total autorización en favor de Neovet, para que lleve a cabo la sedación de mi mascota con el fin de realizar: {{sedationReason}}

en el animal de mi propiedad:

Nombre: {{patientName}}
Especie: {{patientSpecies}}
Raza: {{patientBreed}}
Color de pelaje: {{patientCoatColor}}
Sexo: {{patientSex}}
Edad: {{patientAge}}
Peso: {{patientWeight}} kg

Declaro conocer los riesgos inherentes a la sedación y/o anestesia, incluyendo posibles reacciones adversas, complicaciones respiratorias o cardiovasculares, y en casos extremos, la muerte del animal. Asumo la responsabilidad de los costos del tratamiento y medicación que fueran necesarios.

Firma del propietario: ______________________
Aclaración: {{clientName}}
DNI: {{clientDni}}
Fecha: {{date}}`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "Error: falta DATABASE_URL.\n" +
        "Asegurate de que DATABASE_URL esté en .env.local"
    );
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { consentTemplates } = await import("../src/db/schema/index.js");

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema: { consentTemplates } });

  const templates = [
    {
      id: createId("ctm"),
      name: "Autorización de cirugía y hospitalización",
      bodyTemplate: SURGERY_TEMPLATE,
    },
    {
      id: createId("ctm"),
      name: "Acta de eutanasia",
      bodyTemplate: EUTHANASIA_TEMPLATE,
    },
    {
      id: createId("ctm"),
      name: "Acuerdo de asesoría reproductiva (GenetiCan 1)",
      bodyTemplate: REPRODUCTIVE_TEMPLATE,
    },
    {
      id: createId("ctm"),
      name: "Autorización de sedación",
      bodyTemplate: SEDATION_TEMPLATE,
    },
  ];

  for (const tpl of templates) {
    try {
      await db.insert(consentTemplates).values(tpl);
      console.log(`  Insertada: ${tpl.name}`);
    } catch (err: unknown) {
      const cause = err instanceof Error && "cause" in err ? (err as { cause?: Error }).cause : null;
      const msg = cause?.message ?? (err instanceof Error ? err.message : String(err));
      console.error(`  Error al insertar "${tpl.name}": ${msg}`);
    }
  }

  console.log("\nSeed de plantillas de consentimiento completado.");
  await client.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
