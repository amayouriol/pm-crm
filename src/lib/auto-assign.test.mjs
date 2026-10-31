import { test, expect } from "bun:test";
import { planAssignments, isReferenced } from "./auto-assign.ts";

const R = [
  { nombreCompleto: "Andrea Mayo", nombreCorto: "Andre" },
  { nombreCompleto: "Lucía Pérez", nombreCorto: "Lucía" },
  { nombreCompleto: "Sofía Ruiz", nombreCorto: "Sofi" },
];
const REF = "Por favor, bríndanos una referencia laboral de tu actual trabajo (Nombre y celular/correo)";

test("unassigned applicants are spread equally across coordinators", () => {
  const rows = Array.from({ length: 9 }, () => ({}));
  const plan = planAssignments(rows, R);
  const counts = {};
  for (const v of plan.values()) counts[v] = (counts[v] ?? 0) + 1;
  expect(counts).toEqual({ Andre: 3, "Lucía": 3, Sofi: 3 });
});

test("existing assignments count toward balance and are never changed", () => {
  const rows = [{ "Encargada de la revisión:": "Andre" }, { "Encargada de la revisión:": "Andre" }, {}, {}];
  const plan = planAssignments(rows, R);
  expect(plan.has(0)).toBe(false);
  expect([...plan.values()].includes("Andre")).toBe(false);
});

test("a coordinator named as reference never gets that applicant", () => {
  const row = { [REF]: "Andrea Mayo 999888777" };
  expect(isReferenced(row, R[0])).toBe(true);
  for (let i = 0; i < 20; i++) expect(planAssignments([row], R).get(0)).not.toBe("Andre");
});

test("reference match ignores accents and case", () => {
  expect(isReferenced({ [REF]: "lucia perez" }, R[1])).toBe(true);
});
