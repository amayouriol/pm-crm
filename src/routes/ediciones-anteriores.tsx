import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  LabelList,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { requireSiteAccess } from "@/lib/gate.functions";
import { listEditions } from "@/lib/team.functions";
import { summarizeEditions, type EditionSlice } from "@/lib/editions";
import { Button } from "@/components/ui/button";
import wifLogo from "@/assets/wif-logo.png.asset.json";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export const Route = createFileRoute("/ediciones-anteriores")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({
    meta: [
      { title: "Ediciones anteriores | WIF Mentoría" },
      {
        name: "description",
        content:
          "Postulantes de los programas anteriores de Women in Finance: embudo de selección por año, universidades, sectores y años de experiencia.",
      },
      { property: "og:title", content: "Ediciones anteriores | WIF Mentoría" },
      {
        property: "og:description",
        content:
          "Postulantes de los programas anteriores de Women in Finance: embudo de selección por año, universidades, sectores y años de experiencia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditionsPage,
});


const short = (v: unknown, n = 38) => {
  const s = String(v);
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
};

function Panel({ title, note, className = "", children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`min-w-0 rounded-xl border border-border bg-card p-5 ${className}`}>
      <h3 className="inline-block rounded-md bg-secondary-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
        {title}
      </h3>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Donut({ data }: { data: EditionSlice[] }) {
  const total = data.reduce((a, d) => a + d.postulantes, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="postulantes" nameKey="name" innerRadius="58%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2" title={d.name}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{short(d.name, 44)}</span>
            <span className="font-semibold tabular-nums">{Math.round((d.postulantes / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBars({ data, color, width = 200 }: { data: EditionSlice[]; color: string; width?: number }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" accessibilityLayer margin={{ right: 36 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={width} tick={{ fontSize: 10 }} interval={0} tickFormatter={(v) => short(v, 34)} />
        <Tooltip />
        <Bar dataKey="postulantes" name="Postulantes" fill={color} radius={[0, 4, 4, 0]}>
          <LabelList dataKey="postulantes" position="right" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EditionsPage() {
  const editions = useQuery({ queryKey: ["editions"], queryFn: () => listEditions() });
  const [year, setYear] = useState("todos");
  const all = useMemo(() => (editions.data ? summarizeEditions(editions.data) : null), [editions.data]);
  const data = useMemo(() => (editions.data ? summarizeEditions(editions.data, year) : null), [editions.data, year]);
  const label = year === "todos" ? "todas las ediciones" : `programa ${year}`;
  const maxFunnel = data?.funnel[0]?.cantidad || 1;

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img src={wifLogo.url} alt="Women in Finance" className="h-14 w-auto shrink-0 rounded-lg" />
            <div>
              <h1 className="text-3xl font-light">Ediciones anteriores</h1>
              <p className="mt-2 text-sm text-muted-foreground">Resultados principales de los programas pasados · Historial_2024_2026</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al portal
            </Link>
          </Button>
        </header>

        {editions.isPending && (
          <p role="status" className="py-10 text-sm text-muted-foreground">
            Cargando historial…
          </p>
        )}
        {editions.error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 py-6">
            <p className="text-sm text-destructive">No se pudo cargar el historial.</p>
            <Button variant="outline" onClick={() => editions.refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {data && all && (
          <div className="space-y-6">
            <div role="group" aria-label="Filtrar por año" className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted-foreground">Año:</span>
              {[{ year: "todos", postulantes: all.total }, ...all.years].map((y) => (
                <Button
                  key={y.year}
                  size="sm"
                  variant={year === y.year ? "default" : "outline"}
                  aria-pressed={year === y.year}
                  onClick={() => setYear(y.year)}
                >
                  {y.year === "todos" ? "Todas" : y.year}
                  <span className="ml-1 text-xs opacity-70">({y.postulantes})</span>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Panel title="Resumen" note={`Datos de ${label}`}>
                <p className="text-6xl font-bold text-primary tabular-nums">{data.funnel[3].cantidad}</p>
                <p className="mt-1 text-lg font-semibold uppercase leading-tight text-primary">Mentees aceptadas</p>
                <p className="mt-6 text-3xl font-light">
                  <span className="font-bold text-primary">{data.total}</span> postulantes
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tasa de aceptación: <strong className="text-foreground">{data.funnel[3].pct}%</strong>
                </p>
              </Panel>

              <Panel title="Embudo de conversión" note="Postuladas → Preseleccionadas → Entrevistadas → Aceptadas" className="lg:col-span-2">
                <ol className="space-y-3">
                  {data.funnel.map((step, i) => {
                    const prev = i > 0 ? data.funnel[i - 1].cantidad : 0;
                    const conv = i > 0 && prev ? Math.round((step.cantidad / prev) * 100) : null;
                    return (
                      <li key={step.etapa} className="grid grid-cols-[8.5rem_1fr] items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">{step.etapa}</p>
                          {conv !== null && <p className="text-xs text-muted-foreground">{conv}% de la etapa anterior</p>}
                        </div>
                        <div className="h-10 rounded-md bg-muted">
                          <div
                            className="flex h-full min-w-[4.5rem] items-center justify-between rounded-md px-3 text-sm font-semibold text-primary-foreground transition-all duration-500"
                            style={{ width: `${(step.cantidad / maxFunnel) * 100}%`, background: COLORS[i % COLORS.length] }}
                          >
                            <span className="tabular-nums">{step.cantidad}</span>
                            <span className="text-xs font-normal opacity-90">{step.pct}%</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Panel>
            </div>

            {year === "todos" && (
              <Panel title="Embudo por edición" note="Comparación de cada etapa entre programas">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={all.years.map((y) => {
                      const f = summarizeEditions(editions.data!, y.year).funnel;
                      return { year: y.year, Postuladas: f[0].cantidad, Preseleccionadas: f[1].cantidad, Entrevistadas: f[2].cantidad, Aceptadas: f[3].cantidad };
                    })}
                    accessibilityLayer
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                    <Tooltip />
                    {["Postuladas", "Preseleccionadas", "Entrevistadas", "Aceptadas"].map((k, i) => (
                      <Bar key={k} dataKey={k} fill={COLORS[i]} radius={[4, 4, 0, 0]}>
                        <LabelList dataKey={k} position="top" fontSize={10} />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Panel title="Tipo de universidad" note="Pública = universidad nacional">
                <Donut data={data.tipoUniversidad} />
              </Panel>
              <Panel title="Procedencia" note="Lima o provincias según la universidad">
                <Donut data={data.regions} />
              </Panel>
              <Panel title="Años de experiencia" note="En la industria financiera">
                <Donut data={data.experiencia} />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel title="Sectores (industrias)" note="Top 6 · el resto agrupado en Otros">
                <Donut
                  data={[
                    ...data.sectores.slice(0, 6),
                    ...(data.sectores.length > 6
                      ? [{ name: "Otros", postulantes: data.sectores.slice(6).reduce((a, s) => a + s.postulantes, 0) }]
                      : []),
                  ]}
                />
              </Panel>
              <Panel title="Universidades" note="Top 10">
                <HBars data={data.universidades} color={COLORS[0]} />
              </Panel>
            </div>

            <Panel title="¿Qué estudiaron?" note="Carreras top 12">
              <HBars data={data.carreras} color={COLORS[1]} width={180} />
            </Panel>

            {data.sinAno > 0 && (
              <p className="text-xs text-muted-foreground">{data.sinAno} postulante(s) sin año identificable, incluidas en el total.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
