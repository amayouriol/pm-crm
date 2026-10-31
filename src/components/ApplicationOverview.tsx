import { useMemo, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { applicationOverview, type OverviewRow } from "@/lib/application-overview";
import { regionForUniversity } from "@/lib/constants";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
function weekLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}
function ChartSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 border-t border-border pt-5"><h3 className="mb-5 text-sm font-medium">{title}</h3>{children}</section>;
}

export function ApplicationOverview({ rows }: { rows: OverviewRow[] }) {
  const overview = useMemo(() => applicationOverview(rows), [rows]);
  const regions = useMemo(() => {
    const counts: Record<string, number> = { Lima: 0, Provincias: 0, "No especificado": 0 };
    rows.forEach(({ data }) => counts[regionForUniversity(data["¿Dónde estudiaste?"])]++);
    return Object.entries(counts).map(([region, postulantes]) => ({ region, postulantes }));
  }, [rows]);
  const careers = useMemo(() => group(rows, "¿Qué estudiaste?").sort((a, b) => b.postulantes - a.postulantes).slice(0, 12), [rows]);
  const sectors = useMemo(() => group(rows, "Sector de Finanzas en el que trabajas:"), [rows]);

  return <section aria-label="Resumen de postulaciones" className="space-y-8">
    <div>
      <p className="wif-section-title">Convocatoria · Mentees</p>
      <h2 className="mt-1 text-2xl">Postulaciones hasta el momento</h2>
    </div>
    <dl className="grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-4">
      {[["Postulantes", overview.totals.postulantes], ["Preseleccionadas", overview.totals.preseleccionadas], ["Seleccionadas", overview.totals.seleccionadas], ["Duplas asignadas", overview.totals.duplas]].map(([label, value]) =>
        <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-3xl font-light text-primary">{value}</dd></div>)}
    </dl>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay postulaciones registradas.</p> : <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
      <ChartSection title="Funnel semanal de postulaciones">
        <p className="mb-3 text-xs text-muted-foreground">Semana de inscripción · Estado actual de cada grupo</p>
        {overview.weekly.length > 0 ? <ResponsiveContainer width="100%" height={280}>
          <BarChart data={overview.weekly} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="semana" tickFormatter={weekLabel} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip labelFormatter={(label) => `Semana del ${String(label)}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[0]} radius={[3, 3, 0, 0]} />
            <Bar dataKey="preseleccionadas" name="Preseleccionadas" fill={COLORS[1]} radius={[3, 3, 0, 0]} />
            <Bar dataKey="seleccionadas" name="Seleccionadas" fill={COLORS[2]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer> : <p className="py-16 text-center text-sm text-muted-foreground">No hay fechas de inscripción válidas.</p>}
        {overview.sinFecha > 0 && <p className="mt-2 text-xs text-muted-foreground">{overview.sinFecha} postulante(s) sin fecha válida, incluidas en el total.</p>}
      </ChartSection>
      <ChartSection title="Postulantes por región universitaria">
        <ResponsiveContainer width="100%" height={280}><BarChart data={regions} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="region" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} /><Tooltip />
          <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart></ResponsiveContainer>
      </ChartSection>
      <ChartSection title="Postulantes por carrera (top 12)">
        <ResponsiveContainer width="100%" height={Math.max(280, careers.length * 32)}><BarChart data={careers} layout="vertical" accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} interval={0} /><Tooltip />
          <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
        </BarChart></ResponsiveContainer>
      </ChartSection>
      <ChartSection title="Postulantes por sector de finanzas">
        <ResponsiveContainer width="100%" height={320}><PieChart accessibilityLayer>
          <Pie data={sectors} dataKey="postulantes" nameKey="name" cx="50%" cy="42%" innerRadius={50} outerRadius={95}>
            {sectors.map((sector, i) => <Cell key={sector.name} fill={COLORS[i % COLORS.length]} />)}
          </Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart></ResponsiveContainer>
      </ChartSection>
    </div>}
  </section>;
}

function group(rows: OverviewRow[], column: string) {
  const counts = new Map<string, number>();
  rows.forEach(({ data }) => {
    const name = data[column]?.trim() || "No especificado";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return [...counts].map(([name, postulantes]) => ({ name, postulantes }));
}