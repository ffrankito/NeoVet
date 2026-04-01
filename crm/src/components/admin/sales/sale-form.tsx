"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSale } from "@/app/dashboard/petshop/sales/actions";
import { Trash2 } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "mercadopago", label: "MercadoPago" },
];

interface ProductOption {
  id: string;
  name: string;
  sellPrice: string;
  taxRate: number;
  currentStock: string;
}

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface SaleFormProps {
  products: ProductOption[];
}

export function SaleForm({ products }: SaleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  function addItem() {
    if (!selectedProductId) return;
    if (items.some((i) => i.productId === selectedProductId)) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setItems([
      ...items,
      {
        productId: product.id,
        quantity: 1,
        unitPrice: Number(product.sellPrice),
        taxRate: product.taxRate,
      },
    ]);
    setSelectedProductId("");
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function getProduct(productId: string) {
    return products.find((p) => p.id === productId);
  }

  function itemSubtotal(item: SaleItem) {
    return item.unitPrice * item.quantity;
  }

  function itemTotal(item: SaleItem) {
    return item.unitPrice * item.quantity * (1 + item.taxRate / 100);
  }

  function grandTotal() {
    return items.reduce((sum, i) => sum + itemTotal(i), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Agregá al menos un producto.");
      return;
    }
    if (!paymentMethod) {
      setError("Seleccioná un método de pago.");
      return;
    }

    startTransition(async () => {
      const result = await createSale({
        paymentMethod,
        notes,
        items,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add product row */}
      <div className="space-y-2">
        <Label>Agregar producto</Label>
        <div className="flex gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccioná un producto</option>
            {products
              .filter((p) => !items.some((i) => i.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.sellPrice).toFixed(2)} (stock: {Number(p.currentStock)})
                </option>
              ))}
          </select>
          <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProductId}>
            Agregar
          </Button>
        </div>
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Producto</th>
                <th className="px-4 py-2 text-right font-medium w-24">Cantidad</th>
                <th className="px-4 py-2 text-right font-medium">Precio unit.</th>
                <th className="px-4 py-2 text-right font-medium">IVA</th>
                <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const product = getProduct(item.productId);
                return (
                  <tr key={item.productId} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{product?.name}</td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        type="number"
                        min="1"
                        max={Number(product?.currentStock ?? 9999)}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 1)}
                        className="w-20 ml-auto text-right h-8"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.taxRate}%
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${itemSubtotal(item).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50">
                <td colSpan={4} className="px-4 py-2 text-right font-semibold">
                  Total (con IVA):
                </td>
                <td className="px-4 py-2 text-right font-bold text-lg">
                  ${grandTotal().toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Payment method */}
      <div className="max-w-sm space-y-2">
        <Label htmlFor="paymentMethod">Método de pago *</Label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Seleccioná un método</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="max-w-sm space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones opcionales"
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || items.length === 0}>
          {isPending ? "Registrando..." : "Registrar venta"}
        </Button>
        <a
          href="/dashboard/petshop/sales"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
