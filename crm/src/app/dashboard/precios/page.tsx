import { db } from "@/db";
import { services, products } from "@/db/schema";
import { and, asc, eq, ilike } from "drizzle-orm";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  cirugia: "Cirugía",
  consulta: "Consulta",
  reproduccion: "Reproducción",
  cardiologia: "Cardiología",
  endocrinologia: "Endocrinología",
  estetica: "Estética",
  vacunacion: "Vacunación",
  petshop: "Pet Shop",
  otro: "Otro",
};

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  medicamento: "Medicamento",
  vacuna: "Vacuna",
  insumo_clinico: "Insumo clínico",
  higiene: "Higiene",
  accesorio: "Accesorio",
  juguete: "Juguete",
  alimento: "Alimento",
  transporte: "Transporte",
  otro: "Otro",
};

function formatARS(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PreciosPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const search = q?.trim() ?? "";
  const like = `%${search}%`;

  const [servicesFiltered, productsFiltered] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        category: services.category,
        basePrice: services.basePrice,
      })
      .from(services)
      .where(
        search
          ? and(eq(services.isActive, true), ilike(services.name, like))
          : eq(services.isActive, true)
      )
      .orderBy(asc(services.category), asc(services.name)),
    db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        sellPrice: products.sellPrice,
      })
      .from(products)
      .where(
        search
          ? and(eq(products.isActive, true), ilike(products.name, like))
          : eq(products.isActive, true)
      )
      .orderBy(asc(products.category), asc(products.name)),
  ]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Precios</h1>
        <p className="text-muted-foreground">
          Consulta de referencia de precios de servicios y productos. Solo lectura.
        </p>
      </div>

      <form method="get" className="max-w-md">
        <Input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre de servicio o producto..."
        />
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Servicios</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio base</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesFiltered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    {search ? "Sin resultados para ese término." : "No hay servicios activos."}
                  </TableCell>
                </TableRow>
              ) : (
                servicesFiltered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {SERVICE_CATEGORY_LABELS[s.category] ?? s.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatARS(s.basePrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Productos</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio de venta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsFiltered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    {search ? "Sin resultados para ese término." : "No hay productos activos."}
                  </TableCell>
                </TableRow>
              ) : (
                productsFiltered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatARS(p.sellPrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
