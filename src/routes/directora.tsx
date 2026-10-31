import { PreviousBadges } from "@/components/PreviousBadges";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  listApplicants,
  listMentoras,
  listStaff,
  updateApplicantByDni,
} from "@/lib/sheets.functions";
import { summarizeApplicant } from "@/lib/ai.functions";
import { ESTADO, SCORECARD_COLS, statusOf, type EstadoLabel } from "@/lib/constants";
import { useSession } from "@/lib/session";
import { requireSiteAccess } from "@/lib/gate.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileLeft } from "@/components/ProfileLeft";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/directora")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({ meta: [
    { title: "Panel Ejecutivo | WIF Mentoría" },
    { name: "description", content: "Coordinación, evaluación y resultados de selección de Women in Finance." },
    { property: "og:title", content: "Panel Ejecutivo | WIF Mentoría" },
    { property: "og:description", content: "Coordinación, evaluación y resultados de selección de Women in Finance." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: DirectoraView,
});

type Tab = "panel" | "resultados";

function DirectoraView() {
  const { session, isDirectora, hydrated } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("panel");

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/inscripcion" });
    else if (hydrated && !isDirectora) navigate({ to: "/dashboard" });
  }, [session, isDirectora, hydrated, navigate]);

  const applicants = useQuery({ queryKey: ["applicants"], queryFn: () => listApplicants() });
  const mentoras = useQuery({ queryKey: ["mentoras"], queryFn: () => listMentoras() });
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });

  const rows = applicants.data ?? [];
  const staffList = (staff.data ?? []).filter((s) => s.activo).map((s) => s.nombreCorto);

  if (!session || !isDirectora) return null;

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6">
        <p className="wif-section-title">Panel ejecutivo</p>
        <h1 className="mt-1 text-3xl font-light">Bienvenida, {session.nombreCompleto.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista de todas las postulantes y resultados del programa
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        <TabBtn active={tab === "panel"} onClick={() => setTab("panel")}>Panel de Control</TabBtn>
        <TabBtn active={tab === "resultados"} onClick={() => setTab("resultados")}>Panel de resultados</TabBtn>
      </div>

      {tab === "panel" && <PanelDeControlTab rows={rows} />}
      {tab === "resultados" && (
        <ResultadosTab rows={rows} staffList={staffList} mentoras={mentoras.data ?? []} />
      )}
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ================ TAB 2: Panel de Control (misma lógica que coordinadora, todas) ================

type Filter = "todas" | "fase1" | "fase2" | "pendienteDir" | "hechas";

function PanelDeControlTab({ rows }: { rows: Array<{ data: Record<string, string>; previousYears?: string[] }> }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [q, setQ] = useState("");
  const [openDni, setOpenDni] = useState<string | null>(null);

  const withEstado = useMemo(
    () => rows.map((a) => ({ ...a, estado: statusOf(a.data) })),
    [rows],
  );

  const HECHAS: EstadoLabel[] = [ESTADO.NO_SEL_F1, ESTADO.NO_SEL_F2, ESTADO.COMPLETADO];
  const PENDIENTE_DIR: EstadoLabel[] = [ESTADO.PENDIENTE_DIR, ESTADO.PENDIENTE_DUPLA];

  const m = {
    total: withEstado.length,
    fase1: withEstado.filter((a) => a.estado.label === ESTADO.FASE1).length,
    fase2: withEstado.filter((a) => a.estado.label === ESTADO.FASE2).length,
    pendDir: withEstado.filter((a) => PENDIENTE_DIR.includes(a.estado.label)).length,
    hechas: withEstado.filter((a) => HECHAS.includes(a.estado.label)).length,
  };

  const filtered = useMemo(() => {
    let list = withEstado;
    if (filter === "fase1") list = list.filter((a) => a.estado.label === ESTADO.FASE1);
    if (filter === "fase2") list = list.filter((a) => a.estado.label === ESTADO.FASE2);
    if (filter === "pendienteDir") list = list.filter((a) => PENDIENTE_DIR.includes(a.estado.label));
    if (filter === "hechas") list = list.filter((a) => HECHAS.includes(a.estado.label));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((a) => {
        const nombre = `${a.data["Nombres"]} ${a.data["Apellidos"]}`.toLowerCase();
        return nombre.includes(s) || (a.data["DNI"] ?? "").includes(s);
      });
    }
    return list;
  }, [withEstado, filter, q]);

  const staff = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const mentoras = useQuery({ queryKey: ["mentoras"], queryFn: () => listMentoras() });
  const staffList = (staff.data ?? []).filter((s) => s.activo).map((s) => s.nombreCorto);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MetricCard label="Todas" value={m.total} onClick={() => setFilter("todas")} active={filter === "todas"} />
        <MetricCard label="Fase 1 — Filtro CV" value={m.fase1} onClick={() => setFilter("fase1")} active={filter === "fase1"} />
        <MetricCard label="Fase 2 — Entrevista" value={m.fase2} onClick={() => setFilter("fase2")} active={filter === "fase2"} />
        <MetricCard label="Pendiente directora" value={m.pendDir} onClick={() => setFilter("pendienteDir")} active={filter === "pendienteDir"} />
        <MetricCard label="Revisiones completadas" value={m.hechas} onClick={() => setFilter("hechas")} active={filter === "hechas"} />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="wif-section-title">Lista de postulantes</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} resultado(s)</p>
          </div>
          <Input
            placeholder="Buscar por nombre o DNI…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-[var(--teal-softer)] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nombre completo</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Coordinadora</th>
                <th className="px-4 py-3">Universidad</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.data["DNI"]}
                  className="border-t border-border transition-colors hover:bg-[var(--teal-softer)]"
                >
                  <td className="px-4 py-3">
                    <button onClick={() => setOpenDni(a.data["DNI"])} className="text-left hover:text-primary">
                      {a.data["Nombres"]} {a.data["Apellidos"]}
                    </button>
                    {a.data["¿Candidata destacada?"]?.toLowerCase().includes("true") && (
                      <Badge className="ml-2 bg-[var(--teal-soft)] text-primary" variant="outline">Destacada</Badge>
                    )}
                    <PreviousBadges years={a.previousYears} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.data["DNI"]}</td>
                  <td className="px-4 py-3">{a.data["Encargada de la revisión:"] || "—"}</td>
                  <td className="px-4 py-3">{a.data["¿Dónde estudiaste?"] || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs"
                      style={{ background: a.estado.bg, color: a.estado.fg }}
                    >
                      {a.estado.label}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay postulantes para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {openDni && (
        <ProfileModal
          dni={openDni}
          onClose={() => setOpenDni(null)}
          staffList={staffList}
          mentoras={mentoras.data ?? []}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  onClick,
  active,
}: {
  label: string;
  value: number;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all ${
        active
          ? "border-primary bg-[var(--teal-soft)]"
          : "border-border bg-card hover:border-primary hover:bg-[var(--teal-softer)]"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-light text-primary">{value}</div>
    </button>
  );
}

// ================ TAB 3: Panel de resultados (dos tablas) ================

function ResultadosTab({
  rows,
  staffList,
  mentoras,
}: {
  rows: Array<{ data: Record<string, string> }>;
  staffList: string[];
  mentoras: Array<{ nombre: string }>;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ dni, updates }: { dni: string; updates: Record<string, string> }) =>
      updateApplicantByDni({ data: { dni, updates } }),
    onSuccess: () => {
      toast.success("Guardado");
      qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
  const update = (dni: string, field: string, value: string) =>
    mutation.mutate({ dni, updates: { [field]: value } });

  return (
    <div className="space-y-8">
      <TablaResultadosF1 rows={rows} staffList={staffList} update={update} />
      <TablaResultadosF2 rows={rows} staffList={staffList} update={update} mentoras={mentoras} />
    </div>
  );
}

// ---- Tabla resultados Fase 1: filas donde "Resultados Fase 1" está vacío ----

function TablaResultadosF1({
  rows,
  staffList,
  update,
}: {
  rows: Array<{ data: Record<string, string> }>;
  staffList: string[];
  update: (dni: string, field: string, value: string) => void;
}) {
  const [coord, setCoord] = useState<string>("__all__");
  const [pre, setPre] = useState<string>("__all__");
  const [openDni, setOpenDni] = useState<string | null>(null);

  const pending = useMemo(
    () => rows.filter((r) => !(r.data["Resultados Fase 1"] ?? "").trim()),
    [rows],
  );

  const filtered = useMemo(() => {
    let list = pending;
    if (coord !== "__all__")
      list = list.filter((r) => (r.data["Encargada de la revisión:"] ?? "").trim() === coord);
    if (pre !== "__all__")
      list = list.filter((r) => (r.data["¿Aprueba Fase 1?"] ?? "").trim() === pre);
    return list;
  }, [pending, coord, pre]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="wif-section-title">Tabla resultados Fase 1</p>
          <p className="text-xs text-muted-foreground">
            Postulantes pendientes de decisión final. Edición en línea, se guarda al instante.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={coord} onValueChange={setCoord}>
            <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Coordinadora" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las coordinadoras</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pre} onValueChange={setPre}>
            <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Resultado preliminar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los preliminares</SelectItem>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Tal vez">Tal vez</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="sticky top-0 bg-[var(--teal-softer)] text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Nombre Mentee</th>
              <th className="px-3 py-3">Coordinadora</th>
              <th className="px-3 py-3">Universidad</th>
              <th className="px-3 py-3">Puesto</th>
              <th className="px-3 py-3">Coment. Coord.</th>
              <th className="px-3 py-3">Resultado preliminar</th>
              <th className="px-3 py-3">Destacada</th>
              <th className="px-3 py-3">Coment. Directora</th>
              <th className="px-3 py-3">Invitada prox año</th>
              <th className="px-3 py-3">Resultados Fase 1</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const d = r.data;
              const nombre = d["Nombre Mentee"] || `${d["Nombres"]} ${d["Apellidos"]}`.trim();
              const destacada = isTruthy(d["¿Candidata destacada?"]);
              const invitada = isTruthy(d["Invitada prox año"]);
              return (
                <tr key={d["DNI"]} className="border-t border-border hover:bg-[var(--teal-softer)]">
                  <td className="px-3 py-2">
                    <button onClick={() => setOpenDni(d["DNI"])} className="text-left text-sm hover:text-primary hover:underline">
                      {nombre}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={d["Encargada de la revisión:"] || undefined}
                      onValueChange={(v) => update(d["DNI"], "Encargada de la revisión:", v)}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {staffList.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-xs">{d["¿Dónde estudiaste?"] || "—"}</td>
                  <td className="px-3 py-2 text-xs">{d["Puesto de Trabajo:"] || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    <div className="max-w-[180px] truncate" title={d["Comentarios generales del perfil"]}>
                      {d["Comentarios generales del perfil"] || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {d["¿Aprueba Fase 1?"] || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={destacada}
                      onCheckedChange={(v) => update(d["DNI"], "¿Candidata destacada?", v ? "TRUE" : "FALSE")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <InlineText
                      value={d["Comentarios Nicole"] || ""}
                      onCommit={(v) => update(d["DNI"], "Comentarios Nicole", v)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={invitada}
                      onCheckedChange={(v) => update(d["DNI"], "Invitada prox año", v ? "TRUE" : "FALSE")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={d["Resultados Fase 1"] || undefined}
                      onValueChange={(v) => update(d["DNI"], "Resultados Fase 1", v)}
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre seleccionada">Pre seleccionada</SelectItem>
                        <SelectItem value="No Seleccionada">No Seleccionada</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay postulantes pendientes con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openDni && (
        <ProfileModal dni={openDni} onClose={() => setOpenDni(null)} staffList={staffList} mentoras={[]} />
      )}
    </Card>
  );
}

// ---- Tabla resultados Fase 2 ----

function TablaResultadosF2({
  rows,
  staffList,
  update,
  mentoras,
}: {
  rows: Array<{ data: Record<string, string> }>;
  staffList: string[];
  update: (dni: string, field: string, value: string) => void;
  mentoras: Array<{ nombre: string }>;
}) {
  const [openDni, setOpenDni] = useState<string | null>(null);
  const eligible = useMemo(
    () =>
      rows.filter((r) => {
        const r1 = (r.data["Resultados Fase 1"] ?? "").trim().toLowerCase();
        return r1 === "pre seleccionada" || r1 === "preseleccionada";
      }),
    [rows],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border p-4">
        <p className="wif-section-title">Tabla resultados Fase 2</p>
        <p className="text-xs text-muted-foreground">
          Postulantes pre seleccionadas. Coordinadora, invitada y resultado son editables.
        </p>
      </div>
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="sticky top-0 bg-[var(--teal-softer)] text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Nombre Mentee</th>
              <th className="px-3 py-3">Coordinadora</th>
              <th className="px-3 py-3">Total Scorecard</th>
              <th className="px-3 py-3">Feedback Entrevista</th>
              <th className="px-3 py-3">Feedback referencias</th>
              <th className="px-3 py-3">Resultado preliminar</th>
              <th className="px-3 py-3">Invitada prox año</th>
              <th className="px-3 py-3">Resultados Fase 2</th>
            </tr>
          </thead>
          <tbody>
            {eligible.map((r) => {
              const d = r.data;
              const nombre = d["Nombre Mentee"] || `${d["Nombres"]} ${d["Apellidos"]}`.trim();
              const invitada = isTruthy(d["Invitada prox año"]);
              return (
                <tr key={d["DNI"]} className="border-t border-border hover:bg-[var(--teal-softer)]">
                  <td className="px-3 py-2">
                    <button onClick={() => setOpenDni(d["DNI"])} className="text-left text-sm hover:text-primary hover:underline">
                      {nombre}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={d["Encargada de la revisión:"] || undefined}
                      onValueChange={(v) => update(d["DNI"], "Encargada de la revisión:", v)}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {staffList.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded bg-[var(--teal-softer)] px-2 py-0.5 font-medium text-primary">
                      {d["Total Scorecard de entrevista"] || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="max-w-[200px] truncate" title={d["Feedback de Entrevista"]}>
                      {d["Feedback de Entrevista"] || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="max-w-[200px] truncate" title={d["Feedback referencias"]}>
                      {d["Feedback referencias"] || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5">{d["¿Aprueba Fase 2?"] || "—"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={invitada}
                      onCheckedChange={(v) => update(d["DNI"], "Invitada prox año", v ? "TRUE" : "FALSE")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={d["Resultados Fase 2"] || undefined}
                      onValueChange={(v) => update(d["DNI"], "Resultados Fase 2", v)}
                    >
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Seleccionada">Seleccionada</SelectItem>
                        <SelectItem value="No seleccionada">No seleccionada</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {eligible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay postulantes pre seleccionadas para Fase 2.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openDni && (
        <ProfileModal dni={openDni} onClose={() => setOpenDni(null)} staffList={staffList} mentoras={mentoras} />
      )}
    </Card>
  );
}

function InlineText({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)}
      className="h-8 w-[180px] rounded border border-border bg-background px-2 text-xs focus:border-primary focus:outline-none"
    />
  );
}

function isTruthy(s: string | undefined) {
  return ["true", "sí", "si", "1", "yes"].includes((s || "").trim().toLowerCase());
}

// ---------- Modal reusing profile view + AI summary ----------

function ProfileModal({
  dni,
  onClose,
  staffList,
  mentoras,
}: {
  dni: string;
  onClose: () => void;
  staffList: string[];
  mentoras: Array<{ nombre: string }>;
}) {
  const qc = useQueryClient();
  const applicant = useQuery({
    queryKey: ["applicant", dni],
    queryFn: () =>
      import("@/lib/sheets.functions").then((m) => m.getApplicantByDni({ data: { dni } })),
  });
  const [draft, setDraft] = useState<Record<string, string | number>>({});
  const [summary, setSummary] = useState<string>("");

  const merged = useMemo(() => {
    if (!applicant.data) return {} as Record<string, string>;
    return {
      ...applicant.data.data,
      ...Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, String(v)])),
    };
  }, [applicant.data, draft]);

  const totalScorecard = useMemo(
    () => SCORECARD_COLS.reduce((s, c) => s + (Number(merged[c] || 0) || 0), 0),
    [merged],
  );

  const save = useMutation({
    mutationFn: (u: Record<string, string | number>) => updateApplicantByDni({ data: { dni, updates: u } }),
    onSuccess: () => {
      toast.success("Cambios guardados");
      setDraft({});
      qc.invalidateQueries({ queryKey: ["applicant", dni] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const summarize = useMutation({
    mutationFn: async () => {
      const d = applicant.data?.data;
      if (!d) throw new Error("Sin datos");
      const profile = [
        `Nombre: ${d["Nombres"]} ${d["Apellidos"]}`,
        `Universidad: ${d["¿Dónde estudiaste?"]}  ·  Carrera: ${d["¿Qué estudiaste?"]}`,
        `Sector: ${d["Sector de Finanzas en el que trabajas:"]}  ·  Puesto: ${d["Puesto de Trabajo:"]} en ${d["Lugar de Trabajo Actual:"]}`,
        `Experiencia: ${d["Años de experiencia profesional en la industria financiera:"]} años`,
        `Descripción: ${d["¿Cómo te describirías en 4 lineas?:"]}`,
        `Metas: ${d["¿Cuáles son tus metas profesionales?:"]}`,
        `Interés en el programa: ${d["¿Qué te interesa trabajar durante el programa de mentorias? (ej. Metas de carrera, networking, analysis de habilidades, revisión de CV):"]}`,
        `Impacto esperado de la mentoría: ${d["¿Cómo crees que tener una Mentora y formar parte de la red de Women in Finance ayudaría a impulsar tu carrera?:"]}`,
        `Modelo a seguir: ${d["¿Quién es tu modelo a seguir en el mundo profesional? ¿Por qué? :"]}`,
        `Valores: ${d["¿Cuáles consideras que son los 2 valores que te caracterizan? ¿Por qué?"]}`,
        `LinkedIn: ${d["LinkedIn"]}`,
      ].join("\n");
      const r = await summarizeApplicant({ data: { profile } });
      return r.summary;
    },
    onSuccess: (text) => setSummary(text),
    onError: (e: Error) => toast.error(`IA: ${e.message}`),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[1400px] overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2">
            {applicant.data
              ? `${applicant.data.data["Nombres"]} ${applicant.data.data["Apellidos"]}`
              : "Cargando…"}
            <span className="text-xs font-normal text-muted-foreground">· DNI {dni}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto">
          {applicant.data && (
            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                <Card className="border-primary/30 bg-[var(--teal-softer)] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="wif-section-title flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" /> Resumen Ejecutivo de Perfil por IA
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => summarize.mutate()}
                      disabled={summarize.isPending}
                    >
                      {summarize.isPending ? "Generando…" : summary ? "Regenerar" : "Generar resumen"}
                    </Button>
                  </div>
                  {summary ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{summary}</pre>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Genera un resumen del CV, respuestas y perfil profesional con IA (bajo demanda).
                    </p>
                  )}
                </Card>
                <ProfileLeft data={applicant.data.data} />
              </div>
              <div className="lg:sticky lg:top-0 lg:self-start">
                <EvaluationPanel
                  data={merged}
                  draft={draft}
                  setDraft={setDraft}
                  isDirectora
                  mentoras={mentoras}
                  staffList={staffList}
                  totalScorecard={totalScorecard}
                  onSave={() => save.mutate(draft)}
                  saving={save.isPending}
                  dirty={Object.keys(draft).length > 0}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

