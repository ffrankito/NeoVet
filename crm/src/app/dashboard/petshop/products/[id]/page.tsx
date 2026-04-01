import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeactivateProductButton } from "@/components/admin/products/deactivate-product-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const CATEGORY_LABELS: Record<string, string> = {
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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const isLowStock = Number(product.currentStock) <= Number(product.minStock);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            {!product.isActive && <Badge variant="outline">Inactivo</Badge>}
            {isLowStock && product.isActive && (
              <Badge variant="destructive">Stock bajo</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/petshop/products/${id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </Link>
          {product.isActive && <DeactivateProductButton productId={id} />}
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Stock actual</p>
          <p className={`mt-1 text-lg font-semibold ${isLowStock ? "text-destructive" : ""}`}>
            {Number(product.currentStock)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Stock mínimo</p>
          <p className="mt-1 text-lg">{Number(product.minStock)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Precio de venta</p>
          <p className="mt-1 text-lg font-semibold">
            ${Number(product.sellPrice).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">IVA</p>
          <p className="mt-1 text-lg">{product.taxRate}%</p>
        </div>
      </div>

      {product.costPrice && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Último precio de costo</p>
          <p className="mt-1">
            ${Number(product.costPrice).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      <Link
        href="/dashboard/petshop/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a productos
      </Link>
    </div>
  );
}
