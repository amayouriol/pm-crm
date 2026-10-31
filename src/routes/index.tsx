import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listApplicants, listStaff } from "@/lib/sheets.functions";
import { useSession } from "@/lib/session";
import { requireSiteAccess } from "@/lib/gate.functions";

import { DIRECTORA_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ApplicationOverview } from "@/components/ApplicationOverview";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({ meta: [
    { title: "Resumen del equipo | WIF Mentoría" },
    { name: "description", content: "Resumen interno de postulaciones, avance semanal y acceso a las vistas del equipo de Women in Finance." },
    { property: "og:title", content: "Resumen del equipo | WIF Mentoría" },
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
        <header className="mb-8 flex items-center gap-4 border-b border-border pb-6">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-lg">
            WIF
          </div>
          <div><h1 className="text-3xl font-light">Portal interno</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inscripción al programa de mentoras · Women in Finance
          </p>
          </div>
        </header>

        <section className="mb-10" aria-label="Selecciona tu perfil">
          <h2 className="wif-section-title mb-4">Selecciona tu perfil para ingresar</h2>
          {staff.isLoading && <p className="text-sm text-muted-foreground">Cargando equipo…</p>}
          {staff.error && (
            <p className="text-sm text-destructive">
              No se pudo cargar el equipo: {(staff.error as Error).message}
            </p>
          )}
          {staff.data && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {coordinadoras.map((s) => (
                <Button
                  variant="outline"
                  key={s.nombreCompleto}
                  onClick={() => {
                    setSession({
                      nombreCompleto: s.nombreCompleto,
                      nombreCorto: s.nombreCorto,
                      correo: s.correo,
                    });
                    navigate({ to: "/dashboard" });
                  }}
                  className="group h-auto min-h-28 flex-col items-start justify-start whitespace-normal rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-teal-softer"
                >
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-teal-soft text-primary">
                    {s.nombreCorto.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm">{s.nombreCorto || s.nombreCompleto}</div>
                  <div className="text-xs text-muted-foreground">coordinadora</div>
                </Button>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  setSession({
                    nombreCompleto: DIRECTORA_NAME,
                    nombreCorto: "Nicole",
                    correo: "",
                  });
                  navigate({ to: "/directora" });
                }}
                className="group h-auto min-h-28 flex-col items-start justify-start whitespace-normal rounded-lg border-2 border-primary bg-teal-softer p-4 text-left transition-all hover:bg-teal-soft"
              >
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">Vista Directora</div>
                <div className="text-xs text-muted-foreground">Coordinación y resultados</div>
              </Button>
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
