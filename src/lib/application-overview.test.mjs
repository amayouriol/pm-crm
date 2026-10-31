import { test, expect } from "bun:test";
import { applicationDate, applicationOverview, applicationWeek } from "./application-overview.ts";

test("weekly applications use Monday buckets including Sundays", () => {
  expect(applicationWeek(applicationDate("31/10/2026 20:00:00"))).toBe("2026-10-26");
  expect(applicationWeek(applicationDate("01/11/2026"))).toBe("2026-10-26");
  expect(applicationWeek(applicationDate("02/11/2026"))).toBe("2026-11-02");
});
test("funnel totals and weekly cohorts use existing final phase decisions", () => {
  const result = applicationOverview([
    { data: { "Marca temporal": "26/10/2026", "Resultados Fase 1": "Pre seleccionada", "Resultados Fase 2": "Seleccionada", "Mentora asignada": "Mentora" } },
    { data: { "Marca temporal": "27/10/2026", "¿Aprueba Fase 1?": "Sí" } },
    { data: { "Marca temporal": "09/11/2026", "Resultados Fase 1": "Pre seleccionada" } },
    { data: { "Marca temporal": "31/02/2026" } },
  ]);
  expect(result.totals).toEqual({ postulantes: 4, preseleccionadas: 2, seleccionadas: 1, duplas: 1 });
  expect(result.weekly.map(w => w.postulantes)).toEqual([2, 0, 1]);
  expect(result.sinFecha).toBe(1);
});
test("invalid dates are excluded from weeks without dropping applicant totals", () => {
  expect(applicationDate("31/02/2026")).toBeNull();
  expect(applicationDate("no date")).toBeNull();
  expect(applicationOverview([]).totals.postulantes).toBe(0);
});