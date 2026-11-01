// Embedded previews need a partitioned SameSite=None cookie; the published
// top-level site uses a plain first-party Lax cookie, which every browser keeps.
export function isPreviewHost(host: string | undefined | null): boolean {
  const h = (host ?? "").toLowerCase();
  return h.includes("preview--") || h.endsWith(".lovableproject.com");
}

export function teamCookieOptions(embedded = true) {
  return embedded
    ? { httpOnly: true, secure: true, sameSite: "none" as const, partitioned: true, path: "/" }
    : { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
}
