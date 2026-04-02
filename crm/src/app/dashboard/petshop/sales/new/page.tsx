import { getActiveProductsForSale } from "../actions";
import { SaleForm } from "@/components/admin/sales/sale-form";

export default async function NewSalePage() {
  const products = await getActiveProductsForSale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground">Registrá una venta de productos del pet shop</p>
      </div>
      <SaleForm products={products} />
    </div>
  );
}
