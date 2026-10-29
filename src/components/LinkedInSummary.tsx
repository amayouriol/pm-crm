import { useState, useId } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Linkedin, Sparkles, Loader2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { summarizeLinkedIn } from "@/lib/linkedin.functions";

export function LinkedInSummary() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const summarize = useServerFn(summarizeLinkedIn);

  async function generate() {
    setBusy(true);
    setSummary("");
    setError("");
    try {
      const result = await summarize({ data: { text } });
      setSummary(result.summary);
      setError(result.error || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el resumen.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-5 border-t border-border pt-4">
      <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal px-0 text-left text-primary" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(!open)}>
        <Linkedin /> Resumen de LinkedIn con IA
        {open ? <ChevronDown className="ml-auto" /> : <ChevronRight className="ml-auto" />}
      </Button>
      {open && <div id={`${id}-panel`} className="mt-3 space-y-3">
        <Label htmlFor={id}>Texto del perfil de LinkedIn</Label>
        <Textarea id={id} rows={6} value={text} disabled={busy} maxLength={20000} placeholder="Experiencia, cargos, proyectos y competencias…" onChange={(e) => { setText(e.target.value); setSummary(""); setError(""); }} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{text.length.toLocaleString("es-PE")} / 20.000</span>
          <Button disabled={busy || !text.trim()} onClick={generate}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Resumiendo…" : "Resumir con IA"}
          </Button>
        </div>
        {busy && <p role="status" className="text-sm text-muted-foreground">Analizando experiencia y competencias…</p>}
        {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
        {summary && <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-primary">Experiencia y competencias</h3>
            <Button variant="ghost" size="icon" aria-label="Copiar resumen" title="Copiar resumen" onClick={async () => {
              try { await navigator.clipboard.writeText(summary); toast.success("Resumen copiado"); }
              catch { toast.error("No se pudo copiar el resumen"); }
            }}><Copy /></Button>
          </div>
          <p role="status" className="whitespace-pre-wrap break-words text-sm leading-relaxed">{summary}</p>
        </div>}
      </div>}
    </section>
  );
}