"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertGroomingPrices } from "@/app/dashboard/settings/actions";

type ActionResult = { success?: boolean; error?: string } | undefined;

interface Props {
  min: string;
  mid: string;
  hard: string;
}

export function GroomingPricesForm({ min, mid, hard }: Props) {
  const [result, dispatch, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => upsertGroomingPrices(formData),
    undefined
  );

  return (
    <form action={dispatch} className="max-w-sm space-y-4">
      {result?.success && (
        <p className="text-sm text-green-600">Precios actualizados.</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="grooming_price_min">Tranquilo (min)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            id="grooming_price_min"
            name="grooming_price_min"
            type="number"
            min={0}
            step="0.01"
            defaultValue={min}
            className="pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grooming_price_mid">Normal (mid)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            id="grooming_price_mid"
            name="grooming_price_mid"
            type="number"
            min={0}
            step="0.01"
            defaultValue={mid}
            className="pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grooming_price_hard">Difícil (hard)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <Input
            id="grooming_price_hard"
            name="grooming_price_hard"
            type="number"
            min={0}
            step="0.01"
            defaultValue={hard}
            className="pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar precios"}
      </Button>
    </form>
  );
}
