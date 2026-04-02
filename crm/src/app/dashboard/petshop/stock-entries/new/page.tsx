import { getActiveProducts, getActiveProviders } from "../actions";
import { StockEntryForm } from "@/components/admin/stock-entries/stock-entry-form";

export default async function NewStockEntryPage() {
  const [products, providers] = await Promise.all([
    getActiveProducts(),
    getActiveProviders(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo ingreso de stock</h1>
        <p className="text-muted-foreground">Registrá una entrada de mercadería</p>
      </div>
      <StockEntryForm products={products} providers={providers} />
    </div>
  );
}
