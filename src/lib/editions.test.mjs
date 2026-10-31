import { test, expect } from "bun:test";
import { editionSummary, editionYear, experienceBucket } from "./editions.ts";

const row = (over = {}) => {
  const r = new Array(48).fill("");
  r[0] = "7/3/2025 10:12:00";
  r[2] = "70012345";
  r[4] = "Ana";
  r[7] = "Finanzas";
  r[8] = "Universidad del Pacífico - UP";
  r[10] = "Banca";
  r[47] = "2025";
  for (const [index, value] of Object.entries(over)) r[Number(index)] = value;
  return r;
};

test("year comes from Año de Programa when present", () => {
  expect(editionYear(row({ 47: "Programa 2026" }))).toBe("2026");
});

test("year falls back to the submission timestamp", () => {
  expect(editionYear(row({ 47: "", 0: "7/3/2024 10:12:00" }))).toBe("2024");
});

test("totals, years and regions are aggregated from historical rows", () => {
  const summary = editionSummary([
    row({ 47: "2024" }),
    row({ 47: "2024", 8: "Universidad de Piura - UDEP" }),
    row({ 47: "2025" }),
    row({ 47: "", 0: "no date" }),
    ["", "", "", "", ""], // blank padding row
  ]);
  expect(summary.total).toBe(4);
  expect(summary.years).toEqual([
    { year: "2024", postulantes: 2 },
    { year: "2025", postulantes: 1 },
  ]);
  expect(summary.sinAno).toBe(1);
  expect(summary.regions).toEqual([
    { name: "Lima", postulantes: 3 },
    { name: "Provincias", postulantes: 1 },
  ]);
  expect(summary.carreras[0]).toEqual({ name: "Finanzas", postulantes: 4 });
});

test("funnel counts Postuladas → Preseleccionadas → Entrevistadas → Aceptadas for the chosen year", () => {
  const values = [
    row({ 47: "2025", 32: "Preseleccionada", 33: "Entrevistada", 44: "Seleccionada" }),
    row({ 47: "2025", 32: "Preseleccionada", 33: "Sí", 44: "No seleccionada" }),
    row({ 47: "2025", 32: "No seleccionada", 33: "#N/A" }),
    row({ 47: "2024", 32: "Preseleccionada", 33: "Entrevistada", 44: "Seleccionada" }),
  ];
  expect(editionSummary(values, "2025").funnel.map((s) => s.cantidad)).toEqual([3, 2, 2, 1]);
  expect(editionSummary(values).funnel.map((s) => s.cantidad)).toEqual([4, 3, 3, 2]);
});

test("experience text is grouped into ranges", () => {
  expect(experienceBucket("Menos de 12 meses")).toBe("Menos de 1 año");
  expect(experienceBucket("2")).toBe("1–2 años");
  expect(experienceBucket("4 años")).toBe("3–4 años");
  expect(experienceBucket("5")).toBe("5 años o más");
});
