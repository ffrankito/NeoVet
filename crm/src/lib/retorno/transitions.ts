import { retornoStatusEnum } from "@/db/schema/retorno_queue";

export type RetornoStatus = (typeof retornoStatusEnum.enumValues)[number];

export type TransitionResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED: Record<RetornoStatus, RetornoStatus[]> = {
  pending: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

export function validateTransition(
  from: RetornoStatus,
  to: RetornoStatus,
): TransitionResult {
  if (from === to) {
    return {
      ok: false,
      error: `El retorno ya está en estado '${from}'.`,
    };
  }
  if (from === "completed") {
    return {
      ok: false,
      error:
        "El retorno ya está en estado terminal 'completed'; no se puede modificar.",
    };
  }
  if (from === "pending" && to === "completed") {
    return {
      ok: false,
      error:
        "Transición inválida: debe pasar por 'in_progress' antes de 'completed'.",
    };
  }
  if (!ALLOWED[from].includes(to)) {
    return {
      ok: false,
      error: `Transición no permitida: '${from}' → '${to}'.`,
    };
  }
  return { ok: true };
}
