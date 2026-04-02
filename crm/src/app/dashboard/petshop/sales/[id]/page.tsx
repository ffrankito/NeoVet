import Link from "next/link";
import { notFound } from "next/navigation";
import { getSale } from "../actions";
import { Separator } from "@/components/ui/separator";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
  tarjeta_credito: "Tarjeta de crédito",
  mercadopago: "MercadoPago",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;
  const sale = await getSale(id);

  if (!sale) notFound();

  const grandTotal = sale.items.reduce(
    (sum, item) =>
      sum +
      Number(item.unitPrice) * Number(item.quantity) * (1 + item.taxRate / 100),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Detalle de venta</h1>
        <p className="mt-1 text-muted-foreground">
          {new Date(sale.createdAt).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Método de pago</p>
          <p className="mt-1">{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total</p>
          <p className="mt-1 text-lg font-bold">
            ${grandTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {sale.notes && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Notas</p>
          <p className="mt-1 whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Productos vendidos</h2>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Producto</th>
                <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                <th className="px-4 py-2 text-right font-medium">Precio unit.</th>
                <th className="px-4 py-2 text-right font-medium">IVA</th>
                <th className="px-4 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const subtotal = Number(item.unitPrice) * Number(item.quantity);
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      <Link
                        href={`/dashboard/petshop/products/${item.productId}`}
                        className="text-primary hover:underline"
                      >
                        {item.productName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right">{Number(item.quantity)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.taxRate}%
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${subtotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href="/dashboard/petshop/sales"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a ventas
      </Link>
    </div>
  );
}
