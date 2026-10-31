import { test, expect } from "bun:test";
import { historyYears, previousLabels, normDni } from "./history.ts";

const row = (dni, year, ts = "") => { const r = Array(48).fill(""); r[0] = ts; r[2] = dni; r[47] = year; return r; };

test("matches DNI and labels each past year as Postulante YYYY", () => {
  const m = historyYears([row("81680498", "2025"), row("81680498", "2024"), row("123", "2025")]);
  expect(previousLabels(m.get(normDni(" 81680498 ")))).toEqual(["Postulante 2024", "Postulante 2025"]);
  expect(m.get("999")).toBeUndefined();
});

test("falls back to the timestamp year when Año de Programa is empty", () => {
  expect(historyYears([row("5", "", "12/03/2025 10:00")]).get("5")).toEqual(["2025"]);
});
