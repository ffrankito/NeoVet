"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { recordPayment } from "@/app/dashboard/deudores/actions";

interface PaymentDialogProps {
  chargeId: string;
  remainingBalance: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function PaymentDialog({
  chargeId,
  remainingBalance,
}: PaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFullPayment() {
    setAmount(String(remainingBalance));
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError("Ingresá un monto válido mayor a 0.");
      return;
    }
    if (value > remainingBalance) {
      setError(
        `El monto no puede superar el saldo pendiente (${formatCurrency(remainingBalance)}).`
      );
      return;
    }

    const formData = new FormData();
    formData.append("amount", String(value));

    startTransition(async () => {
      const result = await recordPayment(chargeId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setAmount("");
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <Button variant="outline" size="sm">
          Registrar pago
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar pago</AlertDialogTitle>
          <AlertDialogDescription>
            Saldo pendiente:{" "}
            <span className="font-semibold text-destructive">
              {formatCurrency(remainingBalance)}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Monto del pago</Label>
            <Input
              id="paymentAmount"
              type="number"
              min="0.01"
              max={remainingBalance}
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleFullPayment}
          >
            Pago total ({formatCurrency(remainingBalance)})
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isPending || !amount}
          >
            {isPending ? "Guardando..." : "Confirmar pago"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
