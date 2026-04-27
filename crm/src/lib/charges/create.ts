import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { charges } from "@/db/schema";
import { chargeId as genChargeId } from "@/lib/ids";

/**
 * Creates a charge programmatically from another server-side flow
 * (consultations, grooming sessions, pet shop sales, procedures,
 * hospitalizations). Not a form action — takes direct parameters.
 *
 * Lives in `lib/` (not in any `"use server"` file) so it cannot be invoked
 * directly as a Server Action RPC by a client. Callers must reach it from
 * trusted server context where the source row's authorization has already
 * been established.
 *
 * Returns the new charge ID.
 */
export async function createChargeForSource(
  sourceType: string,
  sourceId: string,
  clientId: string,
  description: string,
  amount: number,
  staffId: string,
): Promise<string> {
  const id = genChargeId();

  await db.insert(charges).values({
    id,
    clientId,
    sourceType,
    sourceId,
    description,
    amount: String(amount),
    paidAmount: "0",
    status: "pending",
    createdById: staffId,
  });

  revalidatePath("/dashboard/deudores");
  return id;
}
