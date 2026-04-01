import Link from "next/link";
import { notFound } from "next/navigation";
import { getCashSession } from "../actions";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { CloseCashForm } from "@/components/admin/cash/close-cash-form";
import { AddMovementForm } from "@/components/admin/cash/add-movement-form";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Débito",
  tarjeta_credito: "Crédito",
  mercadopago: "MercadoPago",
};

interface Props {
  params: Promise<{ id: string }>;
}

function formatMoney(value: string | number) {
  const n = Number(value);
  const formatted = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

function formatTime(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CashSessionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getCashSession(id);

  if (!session) notFound();

  const isOpen = !session.closedAt;

  // Calculate totals by payment method
  const salesTotals: Record<string, number> = {};
  for (const sale of session.sales) {
    const method = sale.paymentMethod;
    salesTotals[method] = (salesTotals[method] ?? 0) + Number(sale.total);
  }

  const movementTotals: Record<string, number> = {};
  for (const mov of session.movements) {
    const key = `${mov.type}_${mov.paymentMethod}`;
    const sign = mov.type === "ingreso" ? 1 : -1;
    movementTotals[mov.paymentMethod] = (movementTotals[mov.paymentMethod] ?? 0) + sign * Number(mov.amount);
  }

  // Combine all payment methods
  const allMethods = new Set([...Object.keys(salesTotals), ...Object.keys(movementTotals)]);
  const breakdown: { method: string; sales: number; movements: number; subtotal: number }[] = [];
  let grandTotal = Number(session.initialAmount);

  for (const method of allMethods) {
    const s = salesTotals[method] ?? 0;
    const m = movementTotals[method] ?? 0;
    breakdown.push({ method, sales: s, movements: m, subtotal: s + m });
    grandTotal += s + m;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {session.name || "Caja principal"}
            </h1>
            {isOpen ? (
              <Badge variant="default">Abierta</Badge>
            ) : (
              <Badge variant="outline">Cerrada</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            Apertura: {formatTime(session.openedAt)}
            {session.closedAt && ` — Cierre: ${formatTime(session.closedAt)}`}
          </p>
        </div>
      </div>

      <Separator />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">Monto inicial</p>
          <p className="text-2xl font-bold">{formatMoney(session.initialAmount)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">Total del período</p>
          <p className={`text-2xl font-bold ${grandTotal < 0 ? "text-destructive" : ""}`}>
            {formatMoney(grandTotal)}
          </p>
        </div>
        {session.closingAmount && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">Efectivo contado al cierre</p>
            <p className="text-2xl font-bold">{formatMoney(session.closingAmount)}</p>
          </div>
        )}
      </div>

      {/* Breakdown by payment method */}
      {breakdown.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Desglose por método de pago</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Método</th>
                  <th className="px-4 py-2 text-right font-medium">Ventas</th>
                  <th className="px-4 py-2 text-right font-medium">Movimientos</th>
                  <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(({ method, sales, movements, subtotal }) => (
                  <tr key={method} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{PAYMENT_LABELS[method] ?? method}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(sales)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(movements)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatMoney(subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales list */}
      {session.sales.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ventas ({session.sales.length})</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Hora</th>
                  <th className="px-4 py-2 text-left font-medium">Método</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {session.sales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">{formatTime(sale.createdAt)}</td>
                    <td className="px-4 py-2">{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      <Link href={`/dashboard/petshop/sales/${sale.id}`} className="text-primary hover:underline">
                        {formatMoney(sale.total)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movements list */}
      {session.movements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Movimientos ({session.movements.length})</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Hora</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium">Método</th>
                  <th className="px-4 py-2 text-left font-medium">Descripción</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {session.movements.map((mov) => (
                  <tr key={mov.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-muted-foreground">{formatTime(mov.createdAt)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={mov.type === "ingreso" ? "default" : "destructive"}>
                        {mov.type === "ingreso" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{PAYMENT_LABELS[mov.paymentMethod] ?? mov.paymentMethod}</td>
                    <td className="px-4 py-2 text-muted-foreground">{mov.description}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {mov.type === "egreso" ? "-" : ""}{formatMoney(mov.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions for open session */}
      {isOpen && (
        <>
          <Separator />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Agregar movimiento</h2>
              <AddMovementForm sessionId={id} />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Cerrar caja</h2>
              <CloseCashForm sessionId={id} />
            </div>
          </div>
        </>
      )}

      {session.notes && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas de cierre</p>
            <p className="mt-1 whitespace-pre-wrap">{session.notes}</p>
          </div>
        </>
      )}

      <Link
        href="/dashboard/cash"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a caja
      </Link>
    </div>
  );
}
