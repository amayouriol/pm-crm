export type OverviewRow = { data: Record<string, string> };

export function applicationDate(value: string | undefined): Date | null {
  if (!value) return null;
  const local = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/);
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (!local && !iso) return null;
  const year = Number(local ? local[3] : iso?.[1]);
  const month = Number(local ? local[2] : iso?.[2]);
  const day = Number(local ? local[1] : iso?.[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function applicationWeek(date: Date): string {
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() || 7) + 1);
  return monday.toISOString().slice(0, 10);
}

function stages(data: Record<string, string>) {
  const r1 = (data["Resultados Fase 1"] ?? "").trim().toLowerCase();
  return {
    preseleccionadas: Number(r1 === "pre seleccionada" || r1 === "preseleccionada"),
    seleccionadas: Number((data["Resultados Fase 2"] ?? "").trim().toLowerCase() === "seleccionada"),
    duplas: Number(Boolean((data["Mentora asignada"] ?? "").trim())),
  };
}

export function applicationOverview(rows: OverviewRow[]) {
  const totals = { postulantes: rows.length, preseleccionadas: 0, seleccionadas: 0, duplas: 0 };
  const weeks = new Map<string, typeof totals & { semana: string }>();
  let sinFecha = 0;
  for (const { data } of rows) {
    const stage = stages(data);
    totals.preseleccionadas += stage.preseleccionadas;
    totals.seleccionadas += stage.seleccionadas;
    totals.duplas += stage.duplas;
    const date = applicationDate(data["Marca temporal"]);
    if (!date) { sinFecha++; continue; }
    const semana = applicationWeek(date);
    const week = weeks.get(semana) ?? { semana, postulantes: 0, preseleccionadas: 0, seleccionadas: 0, duplas: 0 };
    week.postulantes++;
    week.preseleccionadas += stage.preseleccionadas;
    week.seleccionadas += stage.seleccionadas;
    week.duplas += stage.duplas;
    weeks.set(semana, week);
  }
  const weekly = [...weeks.values()].sort((a, b) => a.semana.localeCompare(b.semana));
  if (weekly.length > 1) {
    const first = applicationDate(weekly[0]?.semana);
    const last = weekly.at(-1)?.semana;
    if (first && last) {
      for (let cursor = first; cursor.toISOString().slice(0, 10) <= last; cursor = new Date(cursor.getTime() + 7 * 86400000)) {
        const semana = cursor.toISOString().slice(0, 10);
        if (!weeks.has(semana)) weeks.set(semana, { semana, postulantes: 0, preseleccionadas: 0, seleccionadas: 0, duplas: 0 });
      }
    }
  }
  return { totals, weekly: [...weeks.values()].sort((a, b) => a.semana.localeCompare(b.semana)), sinFecha };
}