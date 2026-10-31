// Browser-safe summary of the Historial_2024_2026 sheet (range A2:AV).
// Column indexes were verified against that sheet's own header row (row 1),
// which is not identical to the current application form.
import { regionForUniversity } from "./constants";

const MARCA_TEMPORAL_COL = 0;
const DNI_COL = 2;
const NOMBRES_COL = 4;
const CARRERA_COL = 7;
const UNIVERSIDAD_COL = 8;
const SECTOR_COL = 10;
const EXPERIENCIA_COL = 15;
const RESULTADO_F1_COL = 32;
const STATUS_ENTREVISTA_COL = 33;
const RESULTADO_F2_COL = 44;
const ANO_COL = 47;

const REGION_ORDER = ["Lima", "Provincias", "No especificado"];
export const EXPERIENCE_BUCKETS = ["Menos de 1 año", "1–2 años", "3–4 años", "5 años o más", "No especificado"];

export type EditionYear = { year: string; postulantes: number };
export type EditionSlice = { name: string; postulantes: number };
export type FunnelStep = { etapa: string; cantidad: number; pct: number };

/** Compact, non-identifying record per historical applicant (what the browser receives). */
export type EditionRecord = {
  year: string;
  carrera: string;
  universidad: string;
  sector: string;
  experiencia: string;
  preseleccionada: boolean;
  entrevistada: boolean;
  aceptada: boolean;
};

export type EditionSummary = {
  total: number;
  sinAno: number;
  years: EditionYear[];
  funnel: FunnelStep[];
  regions: EditionSlice[];
  tipoUniversidad: EditionSlice[];
  universidades: EditionSlice[];
  carreras: EditionSlice[];
  sectores: EditionSlice[];
  experiencia: EditionSlice[];
};

/** Program year of a historical row: "Año de Programa" first, then the submission timestamp. */
export function editionYear(row: string[]): string {
  const fromColumn = (row[ANO_COL] ?? "").match(/\d{4}/)?.[0];
  if (fromColumn) return fromColumn;
  return (row[MARCA_TEMPORAL_COL] ?? "").match(/\b(20\d{2})\b/)?.[0] ?? "";
}

const norm = (v: string | undefined) =>
  (v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** "Años de experiencia" is free text ("2", "Menos de 12 meses", "5 años"…). */
export function experienceBucket(raw: string | undefined): string {
  const v = norm(raw);
  if (!v) return "No especificado";
  if (v.includes("menos") || v.includes("mes")) return "Menos de 1 año";
  const n = Number(v.match(/\d+([.,]\d+)?/)?.[0]?.replace(",", "."));
  if (!Number.isFinite(n)) return "No especificado";
  if (n < 1) return "Menos de 1 año";
  if (n < 3) return "1–2 años";
  if (n < 5) return "3–4 años";
  return "5 años o más";
}

export function isInterviewed(raw: string | undefined): boolean {
  const v = norm(raw);
  return v === "entrevistada" || v === "si";
}

export function universityType(name: string): string {
  const v = norm(name);
  if (!v) return "No especificado";
  return v.includes("nacional") ? "Pública" : "Privada";
}

export function toEditionRecords(values: string[][]): EditionRecord[] {
  const out: EditionRecord[] = [];
  for (const row of values) {
    if (!(row[DNI_COL] ?? "").trim() && !(row[NOMBRES_COL] ?? "").trim()) continue; // blank padding row
    const r1 = norm(row[RESULTADO_F1_COL]).replace(/\s+/g, "");
    const r2 = norm(row[RESULTADO_F2_COL]);
    out.push({
      year: editionYear(row),
      carrera: (row[CARRERA_COL] ?? "").trim(),
      universidad: (row[UNIVERSIDAD_COL] ?? "").trim(),
      sector: (row[SECTOR_COL] ?? "").trim(),
      experiencia: experienceBucket(row[EXPERIENCIA_COL]),
      preseleccionada: r1 === "preseleccionada",
      entrevistada: isInterviewed(row[STATUS_ENTREVISTA_COL]),
      aceptada: r2 === "seleccionada",
    });
  }
  return out;
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/** Groups spelling variants ("Economía", "Economia", "ECONOMIA") under the most common written form. */
function bumpText(map: Map<string, Map<string, number>>, raw: string) {
  const label = raw || "No especificado";
  const key = norm(label).replace(/\s+/g, " ");
  const forms = map.get(key) ?? new Map<string, number>();
  bump(forms, label);
  map.set(key, forms);
}

function collapse(map: Map<string, Map<string, number>>): Map<string, number> {
  const out = new Map<string, number>();
  for (const forms of map.values()) {
    const [label] = [...forms].sort((a, b) => b[1] - a[1])[0];
    out.set(label, [...forms.values()].reduce((a, n) => a + n, 0));
  }
  return out;
}

function topSlices(map: Map<string, number>, limit?: number): EditionSlice[] {
  const out = [...map].map(([name, postulantes]) => ({ name, postulantes })).sort((a, b) => b.postulantes - a.postulantes);
  return limit ? out.slice(0, limit) : out;
}

/** Summary for one program year, or for every edition when year is "todos"/empty. */
export function summarizeEditions(records: EditionRecord[], year = "todos"): EditionSummary {
  const years = new Map<string, number>();
  for (const r of records) if (r.year) bump(years, r.year);

  const rows = year && year !== "todos" ? records.filter((r) => r.year === year) : records;
  const regions = new Map<string, number>();
  const tipos = new Map<string, number>();
  const universidades = new Map<string, Map<string, number>>();
  const carreras = new Map<string, Map<string, number>>();
  const sectores = new Map<string, Map<string, number>>();
  const experiencia = new Map<string, number>();
  let pre = 0;
  let ent = 0;
  let acc = 0;
  let sinAno = 0;

  for (const r of rows) {
    if (!r.year) sinAno++;
    bump(regions, regionForUniversity(r.universidad));
    bump(tipos, universityType(r.universidad));
    bumpText(universidades, r.universidad);
    bumpText(carreras, r.carrera);
    bumpText(sectores, r.sector);
    bump(experiencia, r.experiencia);
    if (r.preseleccionada) pre++;
    if (r.entrevistada) ent++;
    if (r.aceptada) acc++;
  }

  const total = rows.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  return {
    total,
    sinAno,
    years: [...years].map(([y, postulantes]) => ({ year: y, postulantes })).sort((a, b) => a.year.localeCompare(b.year)),
    funnel: [
      { etapa: "Postuladas", cantidad: total, pct: total ? 100 : 0 },
      { etapa: "Preseleccionadas", cantidad: pre, pct: pct(pre) },
      { etapa: "Entrevistadas", cantidad: ent, pct: pct(ent) },
      { etapa: "Aceptadas", cantidad: acc, pct: pct(acc) },
    ],
    regions: REGION_ORDER.filter((r) => regions.has(r)).map((r) => ({ name: r, postulantes: regions.get(r)! })),
    tipoUniversidad: ["Pública", "Privada", "No especificado"]
      .filter((t) => tipos.has(t))
      .map((t) => ({ name: t, postulantes: tipos.get(t)! })),
    universidades: topSlices(collapse(universidades), 10),
    carreras: topSlices(collapse(carreras), 12),
    sectores: topSlices(collapse(sectores)),
    experiencia: EXPERIENCE_BUCKETS.filter((b) => experiencia.has(b)).map((b) => ({ name: b, postulantes: experiencia.get(b)! })),
  };
}

export function editionSummary(values: string[][], year = "todos"): EditionSummary {
  return summarizeEditions(toEditionRecords(values), year);
}
