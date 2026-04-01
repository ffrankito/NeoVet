import { ProductForm } from "@/components/admin/products/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo producto</h1>
        <p className="text-muted-foreground">Agregá un producto al catálogo del pet shop</p>
      </div>
      <ProductForm />
    </div>
  );
}
