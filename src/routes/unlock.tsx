import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { unlockSite } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/unlock")({
  head: () => ({ meta: [
    { title: "Acceso privado | WIF Mentoría" },
    { name: "description", content: "Acceso privado del equipo interno de Women in Finance." },
    { property: "og:title", content: "Acceso privado | WIF Mentoría" },
    { property: "og:description", content: "Acceso privado del equipo interno de Women in Finance." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const { setSession } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setPending(true);
    setError("");
    try {
      const result = await unlock({ data: { password } });
      if (!result.ok) setError("Contraseña incorrecta.");
      else {
        setSession(null);
        await router.navigate({ to: "/", replace: true });
      }
    } catch {
      setError("No se pudo ingresar. Inténtalo nuevamente.");
    } finally { setPending(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground">WIF</div>
        <h1 className="text-3xl font-light">Portal interno</h1>
        <p className="mt-2 text-sm text-muted-foreground">Inscripción al programa de mentoras</p>
      </div>
      <form method="post" onSubmit={submit} className="space-y-5">
        <h2 className="flex items-center gap-2 text-lg"><LockKeyhole className="h-5 w-5 text-primary" />Acceso privado</h2>
        <div className="space-y-2">
          <label htmlFor="team-password" className="text-sm">Contraseña del equipo</label>
          <Input id="team-password" name="password" type="password" autoComplete="current-password" required disabled={pending} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</Button>
      </form>
    </div>
  </main>;
}