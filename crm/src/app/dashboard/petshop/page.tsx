import Link from "next/link";
import { Package, Truck, ShoppingCart, PackagePlus } from "lucide-react";

const sections = [
  {
    href: "/dashboard/petshop/products",
    label: "Productos",
    description: "Catálogo de productos, precios y stock actual.",
    icon: Package,
  },
  {
    href: "/dashboard/petshop/providers",
    label: "Proveedores",
    description: "Gestión de proveedores e ingresos de mercadería.",
    icon: Truck,
  },
  {
    href: "/dashboard/petshop/stock-entries",
    label: "Ingresos de stock",
    description: "Registrar entradas de mercadería y actualizar inventario.",
    icon: PackagePlus,
  },
  {
    href: "/dashboard/petshop/sales",
    label: "Ventas",
    description: "Registro de ventas y movimientos de caja.",
    icon: ShoppingCart,
  },
];

export default function PetShopPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pet Shop</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de inventario, proveedores y ventas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className="relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
