import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplicants, listStaff } from "@/lib/sheets.functions";
import { useSession } from "@/lib/session";
import { requireSiteAccess } from "@/lib/gate.functions";

import { DIRECTORA_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ApplicationOverview } from "@/components/ApplicationOverview";
import { ArrowLeft, ClipboardList, MousePointerClick } from "lucide-react";
import wifLogo from "@/assets/wif-logo.png.asset.json";

export const Route = createFileRoute("/inscripcion")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({ meta: [
    { title: "Inscripción al programa de mentoras 2027 | WIF Mentoría" },
    { name: "description", content: "Resumen interno de postulaciones, avance semanal y acceso a las vistas del equipo de Women in Finance." },
    { property: "og:title", content: "Inscripción al programa de mentoras 2027 | WIF Mentoría" },
    { property: "og:description", content: "Resumen interno de postulaciones, avance semanal y acceso a las vistas del equipo de Women in Finance." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const applicants = useQuery({ queryKey: ["applicants"], queryFn: () => listApplicants() });

  const coordinadoras = (staff.data ?? []).filter(
    (s) => s.activo && s.nombreCompleto.trim().toLowerCase() !== DIRECTORA_NAME.toLowerCase(),
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img src={wifLogo.url} alt="Women in Finance" className="h-14 w-auto shrink-0 rounded-lg" />
            <div><h1 className="text-3xl font-light">Programa de mentoras</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inscripción al programa de mentoras 2027
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

        <section className="mb-10" aria-label="Selecciona tu perfil">
          <h2 className="wif-section-title mb-1">Elige tu perfil</h2>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MousePointerClick className="h-4 w-4 shrink-0 text-primary" />
            Haz clic en tu nombre para ingresar a tu panel de control
          </p>
          {staff.isLoading && <p className="text-sm text-muted-foreground">Cargando equipo…</p>}
          {staff.error && (
            <p className="text-sm text-destructive">
              No se pudo cargar el equipo: {(staff.error as Error).message}
            </p>
          )}
          {staff.data && (
            <div className="flex flex-wrap gap-2.5 lg:flex-nowrap">
              <Button
                variant="outline"
                onClick={() => {
                  setSession({ nombreCompleto: DIRECTORA_NAME, nombreCorto: "Nicole", correo: "" });
                  navigate({ to: "/directora" });
                }}
                className="group h-auto flex-1 min-w-[150px] flex-row items-center justify-start gap-2.5 whitespace-normal rounded-xl p-2.5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.05] hover:shadow-[0_8px_24px_-8px_var(--primary)] border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-foreground/20">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium leading-tight">Nicole</div>
                  <div className="text-[11px] opacity-80">Directora</div>
                </div>
              </Button>
              {coordinadoras.map((s) => (
                <Button
                  variant="outline"
                  key={s.nombreCompleto}
                  onClick={() => {
                    setSession({ nombreCompleto: s.nombreCompleto, nombreCorto: s.nombreCorto, correo: s.correo });
                    navigate({ to: "/dashboard" });
                  }}
                  className="group h-auto flex-1 min-w-[150px] flex-row items-center justify-start gap-2.5 whitespace-normal rounded-xl p-2.5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.05] hover:shadow-[0_8px_24px_-8px_var(--primary)] border border-border bg-card hover:border-primary hover:bg-teal-softer"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-soft text-xs text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {(s.nombreCorto || s.nombreCompleto).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm leading-tight">{s.nombreCorto || s.nombreCompleto}</div>
                    <div className="text-[11px] text-muted-foreground">Coordinadora</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </section>
        {applicants.isPending && <p role="status" className="py-10 text-sm text-muted-foreground">Cargando resumen de postulaciones…</p>}
        {applicants.error && <div role="alert" className="flex flex-wrap items-center gap-3 py-6"><p className="text-sm text-destructive">No se pudo cargar el resumen de postulaciones.</p><Button variant="outline" onClick={() => applicants.refetch()}>Reintentar</Button></div>}
        {applicants.data && <ApplicationOverview rows={applicants.data} />}
      </div>
    </main>
  );
}
