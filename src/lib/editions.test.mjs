import { test, expect } from "bun:test";
import { editionSummary, editionYear } from "./editions.ts";

const row = (over = {}) => {
  const r = new Array(48).fill("");
  r[0] = "7/3/2025 10:12:00";
  r[2] = "70012345";
  r[4] = "Ana";
  r[7] = "Finanzas";
  r[8] = "Universidad del Pacífico - UP";
  r[10] = "Banca";
  r[47] = "2025";
  return { ...r, ...over };
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
    { name: "Lima", postulantes: 2 },
    { name: "Provincias", postulantes: 1 },
    { name: "No especificado", postulantes: 1 },
  ]);
  expect(summary.carreras[0]).toEqual({ name: "Finanzas", postulantes: 4 });
});
