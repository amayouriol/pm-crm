import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, type ComponentType } from "react";
import { useMutation } from "@tanstack/react-query";
import { summarizeApplicant } from "@/lib/ai.functions";
import { ChevronDown, Copy, ExternalLink, FileText, Gem, Handshake, Heart, Linkedin, Mail, Phone, Sparkles, Star, Target, UserRound } from "lucide-react";

const ESSAYS: { col: string; title: string; icon: ComponentType<{ className?: string }>; wide?: boolean }[] = [
  { col: "¿Cómo te describirías en 4 lineas?:", title: "Cómo se describe", icon: UserRound, wide: true },
  { col: "¿Cuáles son tus metas profesionales?:", title: "Metas profesionales", icon: Target },
  { col: "¿Qué te interesa trabajar durante el programa de mentorias? (ej. Metas de carrera, networking, analysis de habilidades, revisión de CV):", title: "Qué quiere trabajar en la mentoría", icon: Sparkles },
  { col: "¿Cómo crees que tener una Mentora y formar parte de la red de Women in Finance ayudaría a impulsar tu carrera?:", title: "Cómo la ayudaría WIF", icon: Handshake },
  { col: "¿Quién es tu modelo a seguir en el mundo profesional? ¿Por qué? :", title: "Modelo a seguir", icon: Star },
  { col: "¿Cuáles consideras que son los 2 valores que te caracterizan? ¿Por qué?", title: "Sus 2 valores", icon: Gem },
  { col: "Lista tus hobbies / intereses fuera del trabajo:", title: "Hobbies e intereses", icon: Heart },
];
import { toast } from "sonner";

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`);
}

function ExecutiveSummary({ data }: { data: Record<string, string> }) {
  const fields: Array<[string, string | undefined]> = [
    ["Universidad", data["¿Dónde estudiaste?"]],
    ["Carrera", data["¿Qué estudiaste?"]],
    ["Sector financiero", data["Sector de Finanzas en el que trabajas:"]],
    ["Puesto", data["Puesto de Trabajo:"]],
    ["Lugar de trabajo", data["Lugar de Trabajo Actual:"]],
    ["Años de experiencia", data["Años de experiencia profesional en la industria financiera:"]],
    ["Descripción profesional", data["¿Cómo te describirías en 4 lineas?:"]],
    ["Metas profesionales", data["¿Cuáles son tus metas profesionales?:"]],
    ["Interés en el programa", data["¿Qué te interesa trabajar durante el programa de mentorias? (ej. Metas de carrera, networking, analysis de habilidades, revisión de CV):"]],
    ["Impacto esperado de la mentoría", data["¿Cómo crees que tener una Mentora y formar parte de la red de Women in Finance ayudaría a impulsar tu carrera?:"]],
    ["Modelo a seguir", data["¿Quién es tu modelo a seguir en el mundo profesional? ¿Por qué? :"]],
    ["Valores", data["¿Cuáles consideras que son los 2 valores que te caracterizan? ¿Por qué?"]],
    ["Hobbies e intereses", data["Lista tus hobbies / intereses fuera del trabajo:"]],
  ];
  const profile = fields
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}: ${value?.trim()}`)
    .join("\n");

  const summary = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Este perfil no tiene respuestas para resumir.");
      const result = await summarizeApplicant({ data: { profile } });
      return result.summary;
    },
    onError: (error: Error) => toast.error(`IA: ${error.message}`),
  });

  return (
    <Card className="border-primary/30 bg-[var(--teal-softer)] p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="wif-section-title flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> Resumen Ejecutivo de Perfil por IA
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => summary.mutate()}
          disabled={summary.isPending || !profile}
        >
          {summary.isPending ? "Generando…" : summary.data ? "Regenerar" : "Generar resumen"}
        </Button>
      </div>
      {summary.data ? (
        <pre className="whitespace-pre-wrap font-sans text-sm">{summary.data}</pre>
      ) : (
        <p className="text-xs text-muted-foreground">
          Genera un resumen de las respuestas y del perfil profesional. El PDF del CV aún no se procesa.
        </p>
      )}
    </Card>
  );
}

export function ProfileLeft({ data }: { data: Record<string, string> }) {
  const email = data["Dirección de correo electrónico"];
  const cel = data["Número de celular"];
  const linkedin = data["LinkedIn"];
  const cv = data["Sube tu CV"];
  const refLaboral = data["Por favor, bríndanos una referencia laboral de tu actual trabajo (Nombre y celular/correo)"];
  const refWif = data["OPCIONAL: Aquí puedes dejar la referencia de alguna ex mentee o mentora de programas anteriores (nombre y celular) que podamos contactar para preguntar por ti"];

  return (
    <div className="space-y-4">
      <ExecutiveSummary key={data["DNI"] || data["Nombres"] || "applicant"} data={data} />

      {/* CONTACTO */}
      <Card className="p-5">
        <p className="wif-section-title mb-4">Contacto</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Dirección de correo electrónico</div>
            <button
              onClick={() => email && copy(email, "Correo")}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-[var(--teal-softer)]"
            >
              <span className="flex items-center gap-2 truncate">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{email || "—"}</span>
              </span>
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Número de celular</div>
            <button
              onClick={() => cel && copy(cel, "Celular")}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-[var(--teal-softer)]"
            >
              <span className="flex items-center gap-2 truncate">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{cel || "—"}</span>
              </span>
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:opacity-80"
            >
              <Linkedin className="h-4 w-4" />
              Perfil de LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {cv && (
            <a href={cv} target="_blank" rel="noreferrer" className="ml-auto">
              <Button
                size="sm"
                className="gap-1.5 text-primary-foreground hover:opacity-90"
                style={{ backgroundColor: "#1C999C" }}
              >
                <FileText className="h-4 w-4" /> Abrir CV (PDF)
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>

        {/* Referencias — bloque plomo */}
        <div className="mt-5 grid grid-cols-1 gap-3 rounded-md bg-muted p-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Referencia Laboral
            </div>
            <div className="mt-1.5 whitespace-pre-wrap text-sm">{refLaboral || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Referencia WIF
            </div>
            <div className="mt-1.5 whitespace-pre-wrap text-sm">{refWif || "—"}</div>
          </div>
        </div>
      </Card>

      {/* TRAYECTORIA — pares en línea */}
      <Card className="p-5">
        <p className="wif-section-title mb-3">Trayectoria Académica y Profesional</p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field label="¿Qué estudiaste?" value={data["¿Qué estudiaste?"]} />
          <Field label="Fecha de Egreso de la Universidad" value={data["Fecha de Egreso de la Universidad:"]} />

          <Field label="Sector de Finanzas en el que trabajas" value={data["Sector de Finanzas en el que trabajas:"]} />
          <Field label="Años de experiencia profesional en la industria financiera" value={data["Años de experiencia profesional en la industria financiera:"]} />

          <Field label="Lugar de Trabajo Actual" value={data["Lugar de Trabajo Actual:"]} />
          <Field label="Puesto de Trabajo" value={data["Puesto de Trabajo:"]} />

          <div className="md:col-span-2">
            <Field label="Principales responsabilidades de tu puesto de trabajo" value={data["Principales responsabilidades de tu puesto de trabajo:"]} clamp />
          </div>
          <Field label="¿Tienes personas a tu cargo?" value={data["¿Tienes personas a tu cargo?"]} />
        </div>
      </Card>

      {/* PERFIL Y ENSAYOS */}
      <Card className="p-5">
        <p className="wif-section-title mb-3">Perfil y Ensayos</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ESSAYS.map((e, i) => (
            <Essay key={e.col} n={i + 1} icon={e.icon} title={e.title} question={e.col} value={data[e.col]} wide={e.wide} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Clamped({ text, lines = 4 }: { text?: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const value = (text ?? "").trim();
  if (!value) return <p className="text-sm text-muted-foreground">Sin respuesta</p>;
  const long = value.length > lines * 70;
  return (
    <div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground" style={!open && long ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}>
        {value}
      </p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {open ? "Ver menos" : "Ver más"}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

function Essay({ n, icon: Icon, title, question, value, wide }: { n: number; icon: ComponentType<{ className?: string }>; title: string; question: string; value?: string; wide?: boolean }) {
  return (
    <section className={`group rounded-xl border border-border border-l-4 border-l-primary bg-card p-4 transition-shadow hover:shadow-md ${wide ? "md:col-span-2" : ""}`}>
      <header className="mb-2 flex items-start gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--teal-soft)] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            <span className="mr-1 text-primary">{String(n).padStart(2, "0")}</span>{title}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground" title={question}>{question.replace(/:$/, "").trim()}</p>
        </div>
      </header>
      <Clamped text={value} />
    </section>
  );
}

function Field({ label, value, clamp }: { label: string; value?: string; clamp?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">{label}</div>
      <div className="mt-1">{clamp ? <Clamped text={value} lines={3} /> : <p className="whitespace-pre-wrap text-sm">{value || "—"}</p>}</div>
    </div>
  );
}
