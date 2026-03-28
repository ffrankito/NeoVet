"use client";

import { useState, useTransition } from "react";
import { updateTreatmentItemStatus } from "@/app/dashboard/consultations/treatment-actions";
import type { TreatmentItem } from "@/db/schema";

type Status = "pending" | "active" | "completed";

const STATUS_CYCLE: Record<Status, Status> = {
  pending:   "active",
  active:    "completed",
  completed: "pending",
};

const STATUS_STYLES: Record<Status, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  active:    "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200 line-through",
};

const STATUS_LABELS: Record<Status, string> = {
  pending:   "Pendiente",
  active:    "En curso",
  completed: "Completado",
};

interface Props {
  item: TreatmentItem;
}

export function TreatmentItemToggle({ item }: Props) {
  const [status, setStatus] = useState<Status>(item.status as Status);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = STATUS_CYCLE[status];
    setStatus(next); // optimistic update — feels instant
    startTransition(async () => {
      await updateTreatmentItemStatus(item.id, next);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity ${STATUS_STYLES[status]} ${isPending ? "opacity-60" : "hover:opacity-80"}`}
        title="Clic para cambiar estado"
      >
        {STATUS_LABELS[status]}
      </button>
      <span className={`text-sm ${status === "completed" ? "line-through text-muted-foreground" : ""}`}>
        {item.description}
      </span>
    </div>
  );
}
