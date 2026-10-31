// Browser-safe, pure logic for automatic balanced reviewer assignment.
export type Reviewer = { nombreCompleto: string; nombreCorto: string };

const REFERENCE_COLS = [
  "Por favor, bríndanos una referencia laboral de tu actual trabajo (Nombre y celular/correo)",
  "OPCIONAL: Aquí puedes dejar la referencia de alguna ex mentee o mentora de programas anteriores (nombre y celular) que podamos contactar para preguntar por ti",
];

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function words(s: string) {
  return norm(s).split(/[^a-z0-9ñ]+/).filter(Boolean);
}

/** True when the coordinator's full name (all name words) appears in a reference field. */
export function isReferenced(data: Record<string, string>, r: Reviewer): boolean {
  const nameWords = words(r.nombreCompleto);
  if (nameWords.length === 0) return false;
  return REFERENCE_COLS.some((c) => {
    const ref = new Set(words(data[c] ?? ""));
    return nameWords.every((w) => ref.has(w));
  });
}

/**
 * Assigns every applicant without "Encargada de la revisión:" to the eligible
 * coordinator with the fewest applicants so far (ties broken randomly).
 * Returns the new assignments as index → nombreCorto.
 */
export function planAssignments(
  rows: Record<string, string>[],
  reviewers: Reviewer[],
  random: () => number = Math.random,
): Map<number, string> {
  const out = new Map<number, string>();
  if (reviewers.length === 0) return out;
  const key = (s: string) => norm(s.trim());
  const counts = new Map(reviewers.map((r) => [key(r.nombreCorto), 0]));
  for (const d of rows) {
    const k = key(d["Encargada de la revisión:"] ?? "");
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  rows.forEach((d, i) => {
    if ((d["Encargada de la revisión:"] ?? "").trim()) return;
    const eligible = reviewers.filter((r) => !isReferenced(d, r));
    if (eligible.length === 0) return;
    const min = Math.min(...eligible.map((r) => counts.get(key(r.nombreCorto)) ?? 0));
    const lowest = eligible.filter((r) => (counts.get(key(r.nombreCorto)) ?? 0) === min);
    const pick = lowest[Math.floor(random() * lowest.length)] ?? lowest[0];
    out.set(i, pick.nombreCorto);
    counts.set(key(pick.nombreCorto), min + 1);
  });
  return out;
}
