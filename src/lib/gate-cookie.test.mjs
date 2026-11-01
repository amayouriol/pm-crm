import { test, expect } from "bun:test";
import { teamCookieOptions, isPreviewHost } from "./gate-cookie.ts";

test("embedded previews keep a partitioned cross-site cookie", () => {
  expect(teamCookieOptions(true)).toEqual({ httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/" });
});

test("published site uses a first-party lax cookie", () => {
  expect(teamCookieOptions(false)).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
});

test("only preview hosts count as embedded", () => {
  expect(isPreviewHost("id-preview--abc.lovable.app")).toBe(true);
  expect(isPreviewHost("pm-crm.lovable.app")).toBe(false);
});
