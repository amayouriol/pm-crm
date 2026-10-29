import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, FileText, Linkedin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { LinkedInSummary } from "@/components/LinkedInSummary";

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`);
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
        <LinkedInSummary key={data["DNI"] || `${data["Nombres"]} ${data["Apellidos"]}`} />
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
            <Field label="Principales responsabilidades de tu puesto de trabajo" value={data["Principales responsabilidades de tu puesto de trabajo:"]} />
          </div>
          <Field label="¿Tienes personas a tu cargo?" value={data["¿Tienes personas a tu cargo?"]} />
        </div>
      </Card>

      {/* PERFIL Y ENSAYOS */}
      <Card className="p-5">
        <p className="wif-section-title mb-3">Perfil y Ensayos</p>
        <dl className="grid grid-cols-1 gap-4">
          {[
            "¿Cómo te describirías en 4 lineas?:",
            "Lista tus hobbies / intereses fuera del trabajo:",
            "¿Quién es tu modelo a seguir en el mundo profesional? ¿Por qué? :",
            "¿Cuáles son tus metas profesionales?:",
            "¿Qué te interesa trabajar durante el programa de mentorias? (ej. Metas de carrera, networking, analysis de habilidades, revisión de CV):",
            "¿Cómo crees que tener una Mentora y formar parte de la red de Women in Finance ayudaría a impulsar tu carrera?:",
            "¿Cuáles consideras que son los 2 valores que te caracterizan? ¿Por qué?",
          ].map((f) => (
            <div key={f}>
              <dt className="text-xs text-muted-foreground">{f.replace(/:$/, "").trim()}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm">{data[f] || "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{value || "—"}</div>
    </div>
  );
}
