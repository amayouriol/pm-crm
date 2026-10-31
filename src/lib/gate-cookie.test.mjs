import { test, expect } from "bun:test";
import { teamCookieOptions } from "./gate-cookie.ts";

test("shared team access survives embedded previews without exposing the encrypted cookie", () => {
  expect(teamCookieOptions()).toEqual({
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
  });
});