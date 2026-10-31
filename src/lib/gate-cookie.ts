// Partitioned cookies retain encrypted access inside the embedded preview
// without sharing the session across unrelated top-level sites.
export function teamCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    partitioned: true,
    path: "/",
  };
}