import { PreviousBadges } from "@/components/PreviousBadges";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getApplicantByDni,
  listMentoras,
  listStaff,
  updateApplicantByDni,
} from "@/lib/sheets.functions";
import { SCORECARD_COLS } from "@/lib/constants";
import { useSession } from "@/lib/session";
import { requireSiteAccess } from "@/lib/gate.functions";
import { ProfileLeft } from "@/components/ProfileLeft";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/postulantes/$dni")({
  beforeLoad: () => requireSiteAccess(),
  head: () => ({ meta: [
    { title: "Perfil de postulante | WIF Mentoría" },
    { name: "description", content: "Perfil, experiencia y evaluación de postulantes de Women in Finance." },
    { property: "og:title", content: "Perfil de postulante | WIF Mentoría" },
    { property: "og:description", content: "Perfil, experiencia y evaluación de postulantes de Women in Finance." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { dni } = Route.useParams();
  const { session, isDirectora, hydrated } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/" });
  }, [session, navigate]);

  const applicant = useQuery({
    queryKey: ["applicant", dni],
    queryFn: () => getApplicantByDni({ data: { dni } }),
    enabled: !!session,
  });

  const mentoras = useQuery({ queryKey: ["mentoras"], queryFn: () => listMentoras() });
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });

  const [draft, setDraft] = useState<Record<string, string | number>>({});

  useEffect(() => {
    setDraft({});
  }, [dni]);

  const mutation = useMutation({
    mutationFn: (updates: Record<string, string | number>) =>
      updateApplicantByDni({ data: { dni, updates } }),
    onSuccess: () => {
      toast.success("Cambios guardados en Google Sheets");
      setDraft({});
      qc.invalidateQueries({ queryKey: ["applicant", dni] });
      qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e: Error) => toast.error(`Error al guardar: ${e.message}`),
  });

  const merged = useMemo(() => {
    if (!applicant.data) return {} as Record<string, string>;
    return { ...applicant.data.data, ...Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, String(v)])) };
  }, [applicant.data, draft]);

  const totalScorecard = useMemo(() => {
    return SCORECARD_COLS.reduce((sum, c) => sum + (Number(merged[c] || 0) || 0), 0);
  }, [merged]);

  if (!session) return null;

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
          ← Volver al panel
        </Link>
        {applicant.data && (
          <div className="mt-2">
            <h1 className="text-3xl font-light tracking-tight">
              {applicant.data.data["Nombres"]} {applicant.data.data["Apellidos"]}
              <PreviousBadges years={applicant.data.previousYears} />
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              DNI: <span className="font-mono">{applicant.data.data["DNI"] || dni}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {applicant.data.data["¿Dónde estudiaste?"] || "—"}
            </div>
          </div>
        )}
      </div>

      {applicant.isLoading && <p className="p-6">Cargando…</p>}
      {applicant.data === null && (
        <Card className="p-8 text-center">
          <p>No se encontró postulante con DNI <span className="font-mono">{dni}</span>.</p>
        </Card>
      )}

      {applicant.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            <ProfileLeft data={applicant.data.data} />
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            <EvaluationPanel
              data={merged}
              draft={draft}
              setDraft={setDraft}
              isDirectora={isDirectora}
              mentoras={mentoras.data ?? []}
              staffList={(staff.data ?? []).filter((s) => s.activo).map((s) => s.nombreCorto)}
              totalScorecard={totalScorecard}
              onSave={() => mutation.mutate(draft)}
              saving={mutation.isPending}
              dirty={Object.keys(draft).length > 0}
            />
          </div>
        </div>
      )}
    </main>
  );
}
