// Browser-safe helpers for the shared team board (tasks + event schedule).
export const TASK_STATES = ["pendiente", "en_progreso", "hecha"] as const;
export type TaskState = (typeof TASK_STATES)[number];

export const TASK_STATE_LABEL: Record<TaskState, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  hecha: "Hecha",
};

export function isTaskState(value: string): value is TaskState {
  return (TASK_STATES as readonly string[]).includes(value);
}

/** pendiente -> en_progreso -> hecha -> pendiente */
export function nextTaskState(current: string): TaskState {
  const index = TASK_STATES.indexOf(isTaskState(current) ? current : "pendiente");
  return TASK_STATES[(index + 1) % TASK_STATES.length];
}

export type TaskLike = { estado: string; fecha: string | null; created_at?: string };

/** Open tasks first (earliest date first, undated next), finished tasks last. */
export function sortTasks<T extends TaskLike>(tasks: T[]): T[] {
  const rank = (t: T) => (t.estado === "hecha" ? 1 : 0);
  const dateRank = (t: T) => (t.fecha ? 0 : 1);
  return [...tasks].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      dateRank(a) - dateRank(b) ||
      (a.fecha ?? "").localeCompare(b.fecha ?? "") ||
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function monthKey(fecha: string): string {
  return fecha.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : key;
}

export type EventGroup<T> = { key: string; label: string; events: T[] };

/** Group events by month, oldest month first, each month ordered by date. */
export function groupEventsByMonth<T extends { fecha: string }>(events: T[]): EventGroup<T>[] {
  const byMonth = new Map<string, T[]>();
  for (const event of events) {
    const key = monthKey(event.fecha);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(event);
    else byMonth.set(key, [event]);
  }
  return [...byMonth]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, bucket]) => ({
      key,
      label: monthLabel(key),
      events: bucket.sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }));
}

/** True when the event date is today or later, compared against a YYYY-MM-DD reference. */
export function isUpcoming(fecha: string, today: string): boolean {
  return fecha >= today;
}
