import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { hasTeamAccess } from "./gate-policy";

export const requireSiteAccess = createServerFn({ method: "GET" }).handler(async () => {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error("Acceso privado no configurado.");
  const { teamSession } = await import("./gate.server");
  if (!hasTeamAccess((await teamSession(secret)).data)) throw redirect({ to: "/unlock" });
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => {
    if (typeof data?.password !== "string" || data.password.length > 1024) throw new Error("Contraseña inválida.");
    return data;
  })
  .handler(async ({ data }) => {
    const expected = process.env['SITE_PASSWORD'];
    const secret = process.env['SESSION_SECRET'];
    if (!expected || !secret) throw new Error("Acceso privado no configurado.");
    const { passwordMatches, teamSession } = await import("./gate.server");
    if (!passwordMatches(data.password, expected)) return { ok: false };
    await (await teamSession(secret)).update({ unlocked: true });
    return { ok: true };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error("Acceso privado no configurado.");
  const { teamSession } = await import("./gate.server");
  await (await teamSession(secret)).clear();
});