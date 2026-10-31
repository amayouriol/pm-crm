import { createServerFn } from "@tanstack/react-start";
import { requireTeamGate } from "./gate.middleware";
import { toEditionRecords } from "./editions";
import { isTaskState } from "./team-board";

export type Task = {
  id: string;
  titulo: string;
  responsable: string;
  estado: string;
  fecha: string | null;
  created_at: string;
};

export type ProgramEvent = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  etapa: string;
  created_at: string;
};

// Column-shaped patches so the database client sees the declared field types.
type TaskPatch = { titulo?: string; responsable?: string; estado?: string; fecha?: string | null };
type EventPatch = { titulo?: string; descripcion?: string; fecha?: string; hora?: string; etapa?: string };

// The shared team gate is the only credential this portal has, so the board
// tables are reached through it and read/written with the privileged client.
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- Validation ----------
function text(value: unknown, max: number, field: string): string {
  if (typeof value !== "string") throw new Error(`${field} inválido.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} demasiado largo.`);
  return trimmed;
}

function isoDate(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`Fecha de ${field} inválida.`);
  }
  return value;
}

function requiredDate(value: unknown, field: string): string {
  const parsed = isoDate(value, field);
  if (!parsed) throw new Error(`La fecha de ${field} es obligatoria.`);
  return parsed;
}

function idOf(value: unknown): string {
  const id = text(value, 64, "Identificador");
  if (!id) throw new Error("Identificador requerido.");
  return id;
}

function horaOf(value: unknown): string {
  const hora = text(value ?? "", 10, "Hora");
  if (hora && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(hora)) throw new Error("Hora inválida.");
  return hora;
}

// ---------- Tasks ----------
export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireTeamGate])
  .handler(async (): Promise<Task[]> => {
    const { data, error } = await (await db()).from("program_tasks").select("*");
    if (error) throw new Error("No se pudo cargar la lista de tareas.");
    return data as Task[];
  });

export const addTask = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const titulo = text(o.titulo, 200, "Título de la tarea");
    if (!titulo) throw new Error("Escribe el título de la tarea.");
    return {
      titulo,
      responsable: text(o.responsable ?? "", 80, "Responsable"),
      fecha: isoDate(o.fecha, "la tarea"),
    };
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await (await db())
      .from("program_tasks")
      .insert({ titulo: data.titulo, responsable: data.responsable, fecha: data.fecha })
      .select("*")
      .single();
    if (error) throw new Error("No se pudo crear la tarea.");
    return row as Task;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const out: TaskPatch & { id: string } = { id: idOf(o.id) };
    if ("titulo" in o) {
      const titulo = text(o.titulo, 200, "Título de la tarea");
      if (!titulo) throw new Error("Escribe el título de la tarea.");
      out.titulo = titulo;
    }
    if ("responsable" in o) out.responsable = text(o.responsable ?? "", 80, "Responsable");
    if ("estado" in o) {
      const estado = String(o.estado ?? "");
      if (!isTaskState(estado)) throw new Error("Estado inválido.");
      out.estado = estado;
    }
    if ("fecha" in o) out.fecha = isoDate(o.fecha, "la tarea");
    if (Object.keys(out).length === 1) throw new Error("No hay cambios que guardar.");
    return out;
  })
  .handler(async ({ data }) => {
    const { id, ...patch } = data as { id: string } & TaskPatch;
    const { data: row, error } = await (await db())
      .from("program_tasks")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error("No se pudo actualizar la tarea.");
    return row as Task;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => ({ id: idOf((d as Record<string, unknown>)?.id) }))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("program_tasks").delete().eq("id", data.id);
    if (error) throw new Error("No se pudo eliminar la tarea.");
    return { ok: true };
  });

// ---------- Events ----------
export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireTeamGate])
  .handler(async (): Promise<ProgramEvent[]> => {
    const { data, error } = await (await db()).from("program_events").select("*");
    if (error) throw new Error("No se pudo cargar el cronograma.");
    return data as ProgramEvent[];
  });

export const addEvent = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const titulo = text(o.titulo, 120, "Título del evento");
    if (!titulo) throw new Error("Escribe el título del evento.");
    return {
      titulo,
      descripcion: text(o.descripcion ?? "", 500, "Descripción"),
      fecha: requiredDate(o.fecha, "del evento"),
      hora: horaOf(o.hora ?? ""),
      etapa: text(o.etapa ?? "", 60, "Etapa"),
    };
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await (await db()).from("program_events").insert(data).select("*").single();
    if (error) throw new Error("No se pudo crear el evento.");
    return row as ProgramEvent;
  });

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const out: EventPatch & { id: string } = { id: idOf(o.id) };
    if ("titulo" in o) {
      const titulo = text(o.titulo, 120, "Título del evento");
      if (!titulo) throw new Error("Escribe el título del evento.");
      out.titulo = titulo;
    }
    if ("descripcion" in o) out.descripcion = text(o.descripcion ?? "", 500, "Descripción");
    if ("fecha" in o) out.fecha = requiredDate(o.fecha, "del evento");
    if ("hora" in o) out.hora = horaOf(o.hora ?? "");
    if ("etapa" in o) out.etapa = text(o.etapa ?? "", 60, "Etapa");
    if (Object.keys(out).length === 1) throw new Error("No hay cambios que guardar.");
    return out;
  })
  .handler(async ({ data }) => {
    const { id, ...patch } = data as { id: string } & EventPatch;
    const { data: row, error } = await (await db())
      .from("program_events")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error("No se pudo actualizar el evento.");
    return row as ProgramEvent;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => ({ id: idOf((d as Record<string, unknown>)?.id) }))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("program_events").delete().eq("id", data.id);
    if (error) throw new Error("No se pudo eliminar el evento.");
    return { ok: true };
  });

// ---------- Past editions (read-only, straight from the historical sheet) ----------
export const listEditions = createServerFn({ method: "GET" })
  .middleware([requireTeamGate])
  .handler(async () => {
    const { getValues } = await import("./sheets.server");
    return toEditionRecords(await getValues("Historial_2024_2026!A2:AV"));
  });
