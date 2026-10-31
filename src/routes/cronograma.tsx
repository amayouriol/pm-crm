import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { requireSiteAccess } from "@/lib/gate.functions";
import { addEvent, deleteEvent, listEvents, updateEvent, type ProgramEvent } from "@/lib/team.functions";
import { groupEventsByMonth, isUpcoming } from "@/lib/team-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import wifLogo from "@/assets/wif-logo.png.asset.json";

const EMPTY_FORM = { titulo: "", fecha: "", hora: "", etapa: "", descripcion: "" };

export const Route = createFileRoute("/cronograma")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({
    meta: [
      { title: "Cronograma de eventos | WIF Mentoría" },
      {
        name: "description",
        content:
          "Fechas de entrevistas, reuniones y hitos del programa de mentoras de Women in Finance.",
      },
      { property: "og:title", content: "Cronograma de eventos | WIF Mentoría" },
      {
        property: "og:description",
        content:
          "Fechas de entrevistas, reuniones y hitos del programa de mentoras de Women in Finance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CronogramaPage,
});

function dayOf(fecha: string) {
  return Number(fecha.slice(8, 10));
}

function CronogramaPage() {
  const queryClient = useQueryClient();
  const events = useQuery({ queryKey: ["events"], queryFn: () => listEvents() });
  const createEvent = useServerFn(addEvent);
  const patchEvent = useServerFn(updateEvent);
  const removeEvent = useServerFn(deleteEvent);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<ProgramEvent | null>(null);
  const [today, setToday] = useState("");

  // Read the clock only in the browser so the server render and hydration agree.
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) await patchEvent({ data: { id: editing.id, ...form } });
      else await createEvent({ data: form });
      return true;
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditing(null);
      refresh();
      toast.success(editing ? "Evento actualizado." : "Evento agregado.");
    },
    onError: (e) => toast.error((e as Error).message || "No se pudo guardar el evento."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvent({ data: { id } }),
    onSuccess: () => {
      refresh();
      toast.success("Evento eliminado.");
    },
    onError: (e) => toast.error((e as Error).message || "No se pudo eliminar el evento."),
  });

  const groups = useMemo(() => groupEventsByMonth(events.data ?? []), [events.data]);

  function startEditing(event: ProgramEvent) {
    setEditing(event);
    setForm({
      titulo: event.titulo,
      fecha: event.fecha,
      hora: event.hora,
      etapa: event.etapa,
      descripcion: event.descripcion,
    });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img src={wifLogo.url} alt="Women in Finance" className="h-14 w-auto shrink-0 rounded-lg" />
            <div>
              <h1 className="text-3xl font-light">Cronograma de eventos</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Entrevistas, reuniones y hitos del programa
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al portal
            </Link>
          </Button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.titulo.trim() || !form.fecha) return;
            save.mutate();
          }}
          className="mb-10 rounded-xl border border-border bg-card p-4"
        >
          <h2 className="wif-section-title mb-3">{editing ? "Editar evento" : "Nuevo evento"}</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Nombre del evento"
              maxLength={120}
              className="min-w-[220px] flex-1"
              aria-label="Nombre del evento"
            />
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-40"
              aria-label="Fecha del evento"
            />
            <Input
              type="time"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              className="w-32"
              aria-label="Hora del evento"
            />
            <Input
              value={form.etapa}
              onChange={(e) => setForm({ ...form, etapa: e.target.value })}
              placeholder="Etapa (ej. Entrevistas)"
              maxLength={60}
              className="w-48"
              aria-label="Etapa del evento"
            />
          </div>
          <Textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Detalle (opcional)"
            maxLength={500}
            rows={2}
            className="mt-2"
            aria-label="Descripción del evento"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={save.isPending || !form.titulo.trim() || !form.fecha}>
              <Plus className="h-4 w-4" />
              {editing ? "Guardar cambios" : "Añadir evento"}
            </Button>
            {editing && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {events.isPending && (
          <p role="status" className="py-6 text-sm text-muted-foreground">
            Cargando cronograma…
          </p>
        )}
        {events.error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 py-6">
            <p className="text-sm text-destructive">No se pudo cargar el cronograma.</p>
            <Button variant="outline" onClick={() => events.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {events.data && events.data.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Aún no hay eventos cargados. Agrega el primero arriba.
          </p>
        )}

        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h2 className="wif-section-title mb-3">{group.label}</h2>
              <ul className="space-y-2">
                {group.events.map((event) => {
                  const past = today ? !isUpcoming(event.fecha, today) : false;
                  return (
                    <li
                      key={event.id}
                      className={`flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-opacity hover:shadow-[0_6px_18px_-10px_var(--primary)] ${
                        past ? "opacity-55" : ""
                      }`}
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-soft text-sm text-primary">
                        {dayOf(event.fecha)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm leading-snug">{event.titulo}</p>
                          {event.etapa && (
                            <span className="rounded-full border border-primary/30 bg-teal-soft px-2 py-0.5 text-[11px] text-primary">
                              {event.etapa}
                            </span>
                          )}
                          {event.hora && (
                            <span className="text-[11px] text-muted-foreground">{event.hora} h</span>
                          )}
                        </div>
                        {event.descripcion && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{event.descripcion}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(event)}
                          aria-label={`Editar ${event.titulo}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-teal-soft hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove.mutate(event.id)}
                          aria-label={`Eliminar ${event.titulo}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
