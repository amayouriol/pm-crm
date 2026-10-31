import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { requireSiteAccess } from "@/lib/gate.functions";
import { listEditions } from "@/lib/team.functions";
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
          "Postulantes de los programas anteriores de Women in Finance: totales por año, región universitaria, carreras y sectores.",
      },
      { property: "og:title", content: "Ediciones anteriores | WIF Mentoría" },
      {
        property: "og:description",
        content:
          "Postulantes de los programas anteriores de Women in Finance: totales por año, región universitaria, carreras y sectores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditionsPage,
});

function ChartSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 border-t border-border pt-5">
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      {note && <p className="mb-3 text-xs text-muted-foreground">{note}</p>}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}

function EditionsPage() {
  const editions = useQuery({ queryKey: ["editions"], queryFn: () => listEditions() });

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img src={wifLogo.url} alt="Women in Finance" className="h-14 w-auto shrink-0 rounded-lg" />
            <div>
              <h1 className="text-3xl font-light">Ediciones anteriores</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Programas 2024, 2025 y 2026 · datos de la pestaña Historial_2024_2026
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

        {editions.data && (
          <div className="space-y-8">
            <dl className="grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-muted-foreground">Postulantes históricas</dt>
                <dd className="mt-2 text-3xl font-light text-primary">{editions.data.total}</dd>
              </div>
              {editions.data.years.map((y) => (
                <div key={y.year}>
                  <dt className="text-sm text-muted-foreground">Programa {y.year}</dt>
                  <dd className="mt-2 text-3xl font-light text-primary">{y.postulantes}</dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <ChartSection title="Postulantes por programa" note="Año de cada edición registrado en el historial">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={editions.data.years} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartSection>
              </div>

              <ChartSection title="Región universitaria" note="Lima o provincias según la universidad declarada">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={editions.data.regions} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSection>

              <ChartSection title="Carreras (top 12)">
                <ResponsiveContainer width="100%" height={Math.max(280, editions.data.carreras.length * 30)}>
                  <BarChart data={editions.data.carreras} layout="vertical" accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} interval={0} />
                    <Tooltip />
                    <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[1]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartSection>

              <div className="lg:col-span-2">
                <ChartSection title="Sectores de finanzas" note="Sectores declarados por las postulantes de todas las ediciones (top 12)">
                  <ResponsiveContainer width="100%" height={Math.max(280, Math.min(editions.data.sectores.length, 12) * 30)}>
                    <BarChart data={editions.data.sectores.slice(0, 12)} layout="vertical" accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} interval={0} />
                      <Tooltip />
                      <Bar dataKey="postulantes" name="Postulantes" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartSection>
              </div>
            </div>

            {editions.data.sinAno > 0 && (
              <p className="text-xs text-muted-foreground">
                {editions.data.sinAno} postulante(s) sin año identificable, incluidas en el total.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
