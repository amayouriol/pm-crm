import { createServerFn } from "@tanstack/react-start";
import { requireTeamGate } from "./gate.middleware";
import {
  COLS,
  DIRECTORA_NAME,
  SCORECARD_COLS,
  SHEET_APPLICANTS,
  SHEET_MENTORAS,
  SHEET_STAFF,
  colIndexOf,
  colLetter,
  type ColName,
} from "./constants";

// ---------- Types ----------
export type ApplicantRow = {
  rowNumber: number; // 1-indexed sheet row
  data: Record<string, string>; // by column header
};

export type StaffMember = {
  nombreCompleto: string; // "Andrea Mayo"
  nombreCorto: string; // "Andre"
  correo: string;
  activo: boolean;
};

// ---------- Helpers ----------
function padRow(row: string[]): string[] {
  const out = row.slice();
  while (out.length < COLS.length) out.push("");
  return out;
}

function rowToRecord(row: string[]): Record<string, string> {
  const padded = padRow(row);
  const rec: Record<string, string> = {};
  COLS.forEach((c, i) => (rec[c] = padded[i] ?? ""));
  return rec;
}

// ---------- Read: all applicants ----------
export const listApplicants = createServerFn({ method: "GET" }).middleware([requireTeamGate]).handler(async () => {
  const { getValues, batchUpdateValues } = await import("./sheets.server");
  const values = await getValues(`${SHEET_APPLICANTS}!A2:AY`);
  const rows: ApplicantRow[] = values
    .map((row, i) => ({ rowNumber: i + 2, data: rowToRecord(row) }))
    .filter((r) => (r.data["DNI"] ?? "").trim().length > 0);

  // Automatic, balanced, random assignment of unassigned applicants.
  try {
    const staff = await getValues(`${SHEET_STAFF}!A2:G`);
    const reviewers = staff
      .filter((r) => (r[0] ?? "").trim() && String(r[6] ?? "").toUpperCase() === "TRUE")
      .map((r) => ({ nombreCompleto: `${r[0] ?? ""} ${r[1] ?? ""}`.trim(), nombreCorto: (r[3] ?? "").trim() }))
      .filter((r) => r.nombreCorto && r.nombreCompleto.toLowerCase() !== DIRECTORA_NAME.toLowerCase());
    const { planAssignments } = await import("./auto-assign");
    const plan = planAssignments(rows.map((r) => r.data), reviewers);
    if (plan.size > 0) {
      const letter = colLetter(colIndexOf("Encargada de la revisión:"));
      await batchUpdateValues(
        [...plan].map(([i, name]) => ({
          range: `${SHEET_APPLICANTS}!${letter}${rows[i].rowNumber}:${letter}${rows[i].rowNumber}`,
          values: [[name]],
        })),
      );
      for (const [i, name] of plan) rows[i].data["Encargada de la revisión:"] = name;
    }
  } catch (e) {
    console.error("[auto-assign] failed:", e);
  }
  return rows;
});

// ---------- Read: single applicant by DNI ----------
export const getApplicantByDni = createServerFn({ method: "GET" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const dni = typeof d === "string" ? d : (d as { dni?: string })?.dni;
    if (!dni || typeof dni !== "string") throw new Error("DNI requerido");
    return { dni: dni.trim() };
  })
  .handler(async ({ data }) => {
    const { getValues } = await import("./sheets.server");
    const values = await getValues(`${SHEET_APPLICANTS}!A2:AY`);
    const dniCol = colIndexOf("DNI");
    const idx = values.findIndex((row) => (row[dniCol] ?? "").trim() === data.dni);
    if (idx === -1) return null;
    return {
      rowNumber: idx + 2,
      data: rowToRecord(values[idx]),
    } satisfies ApplicantRow;
  });

// ---------- Write: update fields by DNI ----------
export const updateApplicantByDni = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const obj = d as { dni?: string; updates?: Record<string, string | number> };
    if (!obj?.dni) throw new Error("DNI requerido");
    if (!obj.updates || typeof obj.updates !== "object") throw new Error("updates requerido");
    for (const k of Object.keys(obj.updates)) {
      if (!(COLS as readonly string[]).includes(k)) {
        throw new Error(`Columna desconocida: ${k}`);
      }
    }
    return { dni: obj.dni.trim(), updates: obj.updates };
  })
  .handler(async ({ data }) => {
    const { getValues, batchUpdateValues } = await import("./sheets.server");
    const values = await getValues(`${SHEET_APPLICANTS}!A2:AY`);
    const dniCol = colIndexOf("DNI");
    const idx = values.findIndex((row) => (row[dniCol] ?? "").trim() === data.dni);
    if (idx === -1) throw new Error(`No se encontró postulante con DNI ${data.dni}`);
    const sheetRow = idx + 2;

    // Auto-compute Total Scorecard if any scorecard input is present
    const merged = { ...rowToRecord(values[idx]), ...data.updates } as Record<string, string | number>;
    const scores = SCORECARD_COLS.map((c) => Number(merged[c] || 0)).filter((n) => !isNaN(n));
    if (SCORECARD_COLS.some((c) => c in data.updates)) {
      const total = scores.reduce((a, b) => a + b, 0);
      (data.updates as Record<string, string | number>)["Total Scorecard de entrevista"] = total;
    }

    const batch = Object.entries(data.updates).map(([header, value]) => {
      const col = colIndexOf(header as ColName);
      const letter = colLetter(col);
      return {
        range: `${SHEET_APPLICANTS}!${letter}${sheetRow}:${letter}${sheetRow}`,
        values: [[value]],
      };
    });
    await batchUpdateValues(batch);
    return { ok: true, rowNumber: sheetRow };
  });

// ---------- Read: mentoras ----------
export const listMentoras = createServerFn({ method: "GET" }).middleware([requireTeamGate]).handler(async () => {
  const { getValues } = await import("./sheets.server");
  const values = await getValues(`${SHEET_MENTORAS}!A2:D`);
  return values
    .filter((r) => (r[0] ?? "").trim() && String(r[3] ?? "").toUpperCase() === "TRUE")
    .map((r) => ({ nombre: r[0], correo: r[1] ?? "", celular: r[2] ?? "" }));
});

// ---------- Read: staff (coordinadoras) ----------
export const listStaff = createServerFn({ method: "GET" }).middleware([requireTeamGate]).handler(async () => {
  const { getValues } = await import("./sheets.server");
  const values = await getValues(`${SHEET_STAFF}!A2:G`);
  return values
    .filter((r) => (r[0] ?? "").trim())
    .map<StaffMember>((r) => ({
      nombreCompleto: `${r[0] ?? ""} ${r[1] ?? ""}`.trim(),
      nombreCorto: (r[3] ?? "").trim(),
      correo: r[4] ?? "",
      activo: String(r[6] ?? "").toUpperCase() === "TRUE",
    }));
});
