import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, ClipboardList, History, MousePointerClick } from "lucide-react";
import { requireSiteAccess } from "@/lib/gate.functions";
import { TaskBoard } from "@/components/TaskBoard";
import wifLogo from "@/assets/wif-logo.png.asset.json";

const SECTIONS = [
  {
    to: "/inscripcion",
    title: "Inscripción al programa de mentoras 2027",
    desc: "Perfiles del equipo, resumen de postulaciones y avance de la convocatoria actual.",
    icon: ClipboardList,
    primary: true,
  },
  {
    to: "/ediciones-anteriores",
    title: "Ediciones anteriores",
    desc: "Postulantes y origen de los programas 2024, 2025 y 2026.",
    icon: History,
    primary: false,
  },
  {
    to: "/cronograma",
    title: "Cronograma de eventos",
    desc: "Entrevistas, reuniones y hitos del programa, con sus fechas.",
    icon: CalendarDays,
    primary: false,
  },
] as const;

export const Route = createFileRoute("/")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({
    meta: [
      { title: "Portal del equipo | WIF Mentoría" },
      {
        name: "description",
        content:
          "Punto de partida del equipo interno de Women in Finance: inscripción al programa de mentoras, ediciones anteriores, cronograma y tareas.",
      },
      { property: "og:title", content: "Portal del equipo | WIF Mentoría" },
      {
        property: "og:description",
        content:
          "Punto de partida del equipo interno de Women in Finance: inscripción al programa de mentoras, ediciones anteriores, cronograma y tareas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamHome,
});

function TeamHome() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex items-center gap-4 border-b border-border pb-6">
          <img src={wifLogo.url} alt="Women in Finance" className="h-14 w-auto shrink-0 rounded-lg" />
          <div>
            <h1 className="text-3xl font-light">Portal del equipo</h1>
            <p className="mt-2 text-sm text-muted-foreground">Women in Finance · Programa de mentoras</p>
          </div>
        </header>

        <section aria-label="Accesos" className="mb-12">
          <h2 className="wif-section-title mb-1">Accesos</h2>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MousePointerClick className="h-4 w-4 shrink-0 text-primary" />
            Elige a dónde quieres ir
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`group flex h-full flex-col rounded-xl p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_var(--primary)] ${
                    s.primary
                      ? "border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-card hover:border-primary hover:bg-teal-softer"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                        s.primary
                          ? "bg-primary-foreground/20"
                          : "bg-teal-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        s.primary ? "opacity-70" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="mt-4 text-sm font-medium leading-snug">{s.title}</div>
                  <div
                    className={`mt-1 text-xs leading-relaxed ${
                      s.primary ? "opacity-80" : "text-muted-foreground"
                    }`}
                  >
                    {s.desc}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <TaskBoard />
      </div>
    </main>
  );
}
