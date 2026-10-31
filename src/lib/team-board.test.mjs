import { test, expect } from "bun:test";
import {
  groupEventsByMonth,
  isUpcoming,
  monthLabel,
  nextTaskState,
  sortTasks,
} from "./team-board.ts";

test("task status cycles pendiente -> en_progreso -> hecha -> pendiente", () => {
  expect(nextTaskState("pendiente")).toBe("en_progreso");
  expect(nextTaskState("en_progreso")).toBe("hecha");
  expect(nextTaskState("hecha")).toBe("pendiente");
  expect(nextTaskState("algo raro")).toBe("en_progreso");
});

test("open tasks come first ordered by date, finished tasks last", () => {
  const sorted = sortTasks([
    { estado: "hecha", fecha: "2026-01-02", created_at: "a" },
    { estado: "pendiente", fecha: null, created_at: "b" },
    { estado: "en_progreso", fecha: "2026-03-01", created_at: "c" },
    { estado: "pendiente", fecha: "2026-02-01", created_at: "d" },
  ]);
  expect(sorted.map((t) => `${t.estado}:${t.fecha ?? "-"}`)).toEqual([
    "pendiente:2026-02-01",
    "en_progreso:2026-03-01",
    "pendiente:-",
    "hecha:2026-01-02",
  ]);
});

test("events group by month, oldest month first, ordered by date inside", () => {
  const groups = groupEventsByMonth([
    { fecha: "2027-03-09" },
    { fecha: "2027-02-20" },
    { fecha: "2027-03-02" },
  ]);
  expect(groups.map((g) => g.label)).toEqual(["febrero 2027", "marzo 2027"]);
  expect(groups[1].events.map((e) => e.fecha)).toEqual(["2027-03-02", "2027-03-09"]);
  expect(monthLabel("2027-01")).toBe("enero 2027");
});

test("an event on today's date still counts as upcoming", () => {
  expect(isUpcoming("2026-10-31", "2026-10-31")).toBe(true);
  expect(isUpcoming("2026-10-30", "2026-10-31")).toBe(false);
});
