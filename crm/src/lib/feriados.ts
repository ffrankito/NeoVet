export type Feriado = {
  dia: number;
  mes: number;
  motivo: string;
  tipo: string;
};

export async function getFeriados(year: number): Promise<Feriado[]> {
  try {
    const res = await fetch(
      `https://api.argentinadatos.com/v1/feriados/${year}`,
      { next: { revalidate: 86400 } } // cache 24hs
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function isFeriado(date: string, feriados: Feriado[]): boolean {
  const d = new Date(date + "T00:00:00");
  return feriados.some(
    (f) => f.dia === d.getDate() && f.mes === d.getMonth() + 1
  );
}