import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listStaff } from "@/lib/sheets.functions";
import { useSession } from "@/lib/session";
import { requireSiteAccess } from "@/lib/gate.functions";

import { DIRECTORA_NAME } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({ meta: [
    { title: "Ingreso | WIF Mentoría" },
    { name: "description", content: "Acceso del equipo al portal de mentoría Women in Finance." },
    { property: "og:title", content: "Ingreso | WIF Mentoría" },
    { property: "og:description", content: "Acceso del equipo al portal de mentoría Women in Finance." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });

  const coordinadoras = (staff.data ?? []).filter(
    (s) => s.activo && s.nombreCompleto.trim().toLowerCase() !== DIRECTORA_NAME.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[var(--teal-softer)] px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground text-lg">
            WIF
          </div>
          <h1 className="text-3xl font-light tracking-tight">Women in Finance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Portal interno · Programa de Mentoría
          </p>
        </div>

        <Card className="p-8">
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
                <button
                  key={s.nombreCompleto}
                  onClick={() => {
                    setSession({
                      nombreCompleto: s.nombreCompleto,
                      nombreCorto: s.nombreCorto,
                      correo: s.correo,
                    });
                    navigate({ to: "/dashboard" });
                  }}
                  className="group flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-[var(--teal-softer)]"
                >
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-[var(--teal-soft)] text-primary">
                    {s.nombreCorto.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm">{s.nombreCorto || s.nombreCompleto}</div>
                  <div className="text-xs text-muted-foreground">coordinadora</div>
                </button>
              ))}

              <button
                onClick={() => {
                  setSession({
                    nombreCompleto: DIRECTORA_NAME,
                    nombreCorto: "Nicole",
                    correo: "",
                  });
                  navigate({ to: "/directora" });
                }}
                className="group flex flex-col items-start rounded-lg border-2 border-primary bg-[var(--teal-softer)] p-4 text-left transition-all hover:bg-[var(--teal-soft)]"
              >
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">Vista General</div>
                <div className="text-xs text-muted-foreground">Vista Directora</div>
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
