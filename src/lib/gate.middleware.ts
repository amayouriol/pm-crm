import { createMiddleware } from "@tanstack/react-start";

export const requireTeamGate = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error("Acceso privado no configurado.");
  const { requireTeamAccess } = await import("./gate.server");
  await requireTeamAccess(secret);
  return next();
});