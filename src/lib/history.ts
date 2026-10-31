// Browser-safe: build DNI → previous application years from Historial_2024_2026 rows (A2:AV).
const DNI_COL = 2;
const YEAR_COL = 47; // "Año de Programa"
const TS_COL = 0; // "Marca temporal" fallback

export function normDni(v: string | undefined) {
  return (v ?? "").replace(/\s+/g, "").replace(/^0+(?=\d)/, "").toUpperCase();
}

export function historyYears(values: string[][]): Map<string, string[]> {
  const out = new Map<string, Set<string>>();
  for (const row of values) {
    const dni = normDni(row[DNI_COL]);
    if (!dni) continue;
    const year = (row[YEAR_COL] ?? "").match(/\d{4}/)?.[0] ?? (row[TS_COL] ?? "").match(/\b(20\d{2})\b/)?.[1] ?? "";
    const set = out.get(dni) ?? new Set<string>();
    set.add(year);
    out.set(dni, set);
  }
  return new Map([...out].map(([k, s]) => [k, [...s].sort()]));
}

export function previousLabels(years: string[] | undefined): string[] {
  return (years ?? []).map((y) => (y ? `Postulante ${y}` : "Postulante anterior"));
}
