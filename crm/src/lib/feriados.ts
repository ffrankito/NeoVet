export type Feriado = {
  fecha: string; // YYYY-MM-DD
  tipo: string;
  nombre: string;
};

export async function getFeriados(year: number): Promise<Feriado[]> {
  try {
    const res = await fetch(
      `https://api.argentinadatos.com/v1/feriados/${year}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function isFeriado(date: string, feriados: Feriado[]): boolean {
  return feriados.some((f) => f.fecha === date);
}