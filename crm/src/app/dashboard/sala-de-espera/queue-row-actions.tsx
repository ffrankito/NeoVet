"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRetorno, completeRetorno, startRetorno } from "./actions";

type RetornoStatus = "pending" | "in_progress" | "completed";

type Props = {
  retorno: {
    id: string;
    status: RetornoStatus;
    assignedToStaffId: string | null;
  };
  assignableStaff: { id: string; name: string; role: string }[];
};

const UNASSIGNED = "__none__";

export function QueueRowActions({ retorno, assignableStaff }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string; success?: true }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={retorno.assignedToStaffId ?? UNASSIGNED}
        onValueChange={(value) =>
          run(() =>
            assignRetorno(retorno.id, value === UNASSIGNED ? null : value),
          )
        }
        disabled={isPending}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Asignar a..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
          {assignableStaff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {retorno.status === "pending" && (
        <Button
          size="sm"
          onClick={() => run(() => startRetorno(retorno.id))}
          disabled={isPending}
        >
          {isPending ? "..." : "Iniciar"}
        </Button>
      )}
      {retorno.status === "in_progress" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => completeRetorno(retorno.id))}
          disabled={isPending}
        >
          {isPending ? "..." : "Completar"}
        </Button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
