import { revalidatePath } from "next/cache";

/**
 * Wipes the cached renders for every dashboard page that surfaces bot-driven
 * data. Call this after every successful bot mutation (new client, new
 * appointment, appointment update) so reception sees the change without
 * needing to hard-refresh.
 *
 * Server Actions inside the dashboard already revalidate per-route. This
 * helper is the bot-side equivalent: a single broad sweep covering the
 * routes a fresh WhatsApp event could affect.
 */
export function revalidateBotMutation(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/sala-de-espera");
}
