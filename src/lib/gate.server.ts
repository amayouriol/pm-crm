import { useSession, setResponseHeader } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { hasTeamAccess } from "./gate-policy";

export function passwordMatches(input: string, expected: string): boolean {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}

export async function teamSession(password: string) {
  setResponseHeader("cache-control", "private, no-store");
  return useSession<{ unlocked?: boolean }>({
    password,
    name: "wif-team-access",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

export async function requireTeamAccess(password: string) {
  const session = await teamSession(password);
  if (!hasTeamAccess(session.data)) throw new Error("Acceso privado. Ingresa la contraseña del equipo.");
}