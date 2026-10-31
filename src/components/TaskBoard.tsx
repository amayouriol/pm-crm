import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, UserRound } from "lucide-react";
import { addTask, deleteTask, listTasks, updateTask } from "@/lib/team.functions";
import {
  TASK_STATE_LABEL,
  isTaskState,
  nextTaskState,
  sortTasks,
  type TaskState,
} from "@/lib/team-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATE_STYLES: Record<TaskState, string> = {
  pendiente: "border-border bg-muted text-muted-foreground",
  en_progreso: "border-primary/30 bg-teal-soft text-primary",
  hecha: "border-primary bg-primary text-primary-foreground",
};

function stateStyle(estado: string) {
  return STATE_STYLES[isTaskState(estado) ? estado : "pendiente"];
}

function formatDate(fecha: string | null) {
  if (!fecha) return "";
  const [year, month, day] = fecha.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
}

export function TaskBoard() {
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const createTask = useServerFn(addTask);
  const patchTask = useServerFn(updateTask);
  const removeTask = useServerFn(deleteTask);

  const [titulo, setTitulo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const create = useMutation({
    mutationFn: async () => {
      await createTask({ data: { titulo, responsable, fecha: fecha || null } });
      return true;
    },
    onSuccess: () => {
      setTitulo("");
      setResponsable("");
      setFecha("");
      refresh();
    },
    onError: (e) => toast.error((e as Error).message || "No se pudo crear la tarea."),
  });

  const cycle = useMutation({
    mutationFn: (task: { id: string; estado: string }) =>
      patchTask({ data: { id: task.id, estado: nextTaskState(task.estado) } }),
    onSuccess: refresh,
    onError: (e) => toast.error((e as Error).message || "No se pudo actualizar la tarea."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTask({ data: { id } }),
    onSuccess: refresh,
    onError: (e) => toast.error((e as Error).message || "No se pudo eliminar la tarea."),
  });

  const ordered = sortTasks(tasks.data ?? []);
  const abiertas = ordered.filter((t) => t.estado !== "hecha").length;

  return (
    <section aria-label="Lista de tareas" className="border-t border-border pt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="wif-section-title mb-1">Lista de tareas</h2>
          <p className="text-sm text-muted-foreground">
            Pendencias del equipo · {abiertas} abiertas de {ordered.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!titulo.trim()) return;
          create.mutate();
        }}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nueva tarea…"
          maxLength={200}
          className="min-w-[220px] flex-1"
          aria-label="Título de la tarea"
        />
        <Input
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          placeholder="Responsable"
          maxLength={80}
          className="w-40"
          aria-label="Responsable de la tarea"
        />
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-40"
          aria-label="Fecha límite de la tarea"
        />
        <Button type="submit" size="sm" disabled={create.isPending || !titulo.trim()}>
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </form>

      {tasks.isPending && <p className="py-6 text-sm text-muted-foreground">Cargando tareas…</p>}
      {tasks.error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 py-6">
          <p className="text-sm text-destructive">No se pudo cargar la lista de tareas.</p>
          <Button variant="outline" size="sm" onClick={() => tasks.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {tasks.data && ordered.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Aún no hay tareas. Escribe la primera arriba.
        </p>
      )}

      {ordered.length > 0 && (
        <ul className="space-y-2">
          {ordered.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-[0_6px_18px_-10px_var(--primary)]"
            >
              <button
                type="button"
                onClick={() => cycle.mutate({ id: t.id, estado: t.estado })}
                title="Clic para cambiar el estado"
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${stateStyle(t.estado)}`}
              >
                {TASK_STATE_LABEL[isTaskState(t.estado) ? t.estado : "pendiente"]}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm leading-snug ${
                    t.estado === "hecha" ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {t.titulo}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {t.responsable && (
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3 w-3 shrink-0" />
                      {t.responsable}
                    </span>
                  )}
                  {t.fecha && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {formatDate(t.fecha)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(t.id)}
                aria-label={`Eliminar la tarea ${t.titulo}`}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
