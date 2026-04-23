import { ilike, or, type SQL } from "drizzle-orm";
import { patients, clients } from "@/db/schema";

export function buildPatientAwareSearchClause(
  term: string | undefined
): SQL | undefined {
  if (!term) return undefined;
  const trimmed = term.trim();
  if (!trimmed) return undefined;
  const pattern = `%${trimmed}%`;
  return or(
    ilike(patients.name, pattern),
    ilike(clients.name, pattern),
    ilike(clients.dni, pattern),
    ilike(clients.phone, pattern),
    ilike(clients.address, pattern)
  );
}
