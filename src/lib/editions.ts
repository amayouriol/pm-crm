// Browser-safe summary of the Historial_2024_2026 sheet (range A2:AV).
// Column indexes were verified against that sheet's own header row (row 1),
// which is not identical to the current application form.
import { regionForUniversity } from "./constants";

const DNI_COL = 2;
const NOMBRES_COL = 4;
const CARRERA_COL = 7;
const UNIVERSIDAD_COL = 8;
const SECTOR_COL = 10;
const MARCA_TEMPORAL_COL = 0;
const ANO_COL = 47;

const REGION_ORDER = ["Lima", "Provincias", "No especificado"];

export type EditionYear = { year: string; postulantes: number };
export type EditionSlice = { name: string; postulantes: number };

export type EditionSummary = {
  total: number;
  sinAno: number;
  years: EditionYear[];
  regions: EditionSlice[];
  carreras: EditionSlice[];
  sectores: EditionSlice[];
};

/** Program year of a historical row: "Año de Programa" first, then the submission timestamp. */
export function editionYear(row: string[]): string {
  const fromColumn = (row[ANO_COL] ?? "").match(/\d{4}/)?.[0];
  if (fromColumn) return fromColumn;
  return (row[MARCA_TEMPORAL_COL] ?? "").match(/\b(20\d{2})\b/)?.[0] ?? "";
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topSlices(map: Map<string, number>, limit?: number): EditionSlice[] {
  const out = [...map].map(([name, postulantes]) => ({ name, postulantes })).sort((a, b) => b.postulantes - a.postulantes);
  return limit ? out.slice(0, limit) : out;
}

export function editionSummary(values: string[][]): EditionSummary {
  const years = new Map<string, number>();
  const regions = new Map<string, number>();
  const carreras = new Map<string, number>();
  const sectores = new Map<string, number>();
  let total = 0;
  let sinAno = 0;

  for (const row of values) {
    const dni = (row[DNI_COL] ?? "").trim();
    const nombres = (row[NOMBRES_COL] ?? "").trim();
    if (!dni && !nombres) continue; // blank padding row
    total++;

    const year = editionYear(row);
    if (year) bump(years, year);
    else sinAno++;

    bump(regions, regionForUniversity(row[UNIVERSIDAD_COL]));
    bump(carreras, (row[CARRERA_COL] ?? "").trim() || "No especificado");
    bump(sectores, (row[SECTOR_COL] ?? "").trim() || "No especificado");
  }

  const orderedRegions = REGION_ORDER.filter((r) => regions.has(r)).map((r) => ({ name: r, postulantes: regions.get(r)! }));

  return {
    total,
    sinAno,
    years: [...years].map(([year, postulantes]) => ({ year, postulantes })).sort((a, b) => a.year.localeCompare(b.year)),
    regions: orderedRegions,
    carreras: topSlices(carreras, 12),
    sectores: topSlices(sectores),
  };
}
