import { db } from "../index";
import { services } from "../schema/services";
import { serviceId } from "../../lib/ids";
import { eq } from "drizzle-orm";

const SERVICES = [
  {
    name: "Consulta general",
    category: "consulta" as const,
    defaultDurationMinutes: 30,
    blockDurationMinutes: null,
    basePrice: null,
  },
  {
    name: "Cirugia",
    category: "cirugia" as const,
    defaultDurationMinutes: 60,
    blockDurationMinutes: 120,
    basePrice: null,
  },
  {
    name: "Estetica y Peluqueria",
    category: "peluqueria" as const,
    defaultDurationMinutes: 60,
    blockDurationMinutes: null,
    basePrice: null,
  },
  {
    name: "Vacunacion",
    category: "vacunacion" as const,
    defaultDurationMinutes: 15,
    blockDurationMinutes: null,
    basePrice: null,
  },
  {
    name: "Cardiologia",
    category: "cardiologia" as const,
    defaultDurationMinutes: 45,
    blockDurationMinutes: null,
    basePrice: null,
  },
  {
    name: "Reproduccion",
    category: "reproduccion" as const,
    defaultDurationMinutes: 30,
    blockDurationMinutes: null,
    basePrice: null,
  },
];

async function main() {
  console.log("Seeding services...");

  for (const service of SERVICES) {
    const existing = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.name, service.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  skipping "${service.name}" — already exists`);
      continue;
    }

    await db.insert(services).values({ id: serviceId(), ...service });
    console.log(`  inserted "${service.name}"`);
  }

  console.log(`Done.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
