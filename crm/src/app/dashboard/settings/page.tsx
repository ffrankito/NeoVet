import { db } from "@/db";
import { settings } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button-variants";
import { GroomingPricesForm } from "@/components/admin/settings/grooming-prices-form";

const PRICE_KEYS = ["grooming_price_min", "grooming_price_mid", "grooming_price_hard"] as const;

export default async function SettingsPage() {
  const rows = await db.select().from(settings);
  const priceMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales del sistema.</p>
      </div>

      {/* Staff management link */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Equipo</h2>
            <p className="text-sm text-muted-foreground">Usuarios del sistema y sus roles.</p>
          </div>
          <a href="/dashboard/settings/staff" className={buttonVariants({ variant: "outline" })}>
            Gestionar equipo →
          </a>
        </div>
      </section>

      <div className="border-t" />
  {/* Catálogo de servicios */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Catálogo de servicios</h2>
            <p className="text-sm text-muted-foreground">
              Servicios disponibles para agendar turnos.
            </p>
          </div>
          <a href="/dashboard/settings/services" className={buttonVariants({ variant: "outline" })}>
            Gestionar servicios →
          </a>
        </div>
      </section>
      
      {/* Grooming prices */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Precios de peluquería</h2>
          <p className="text-sm text-muted-foreground">
            Precio base por nivel de dificultad. El peluquero puede ajustar el precio final por sesión.
          </p>
        </div>
        <GroomingPricesForm
          min={priceMap["grooming_price_min"] ?? ""}
          mid={priceMap["grooming_price_mid"] ?? ""}
          hard={priceMap["grooming_price_hard"] ?? ""}
        />
      </section>
    </div>
  );
}
