import { test, expect } from "bun:test";
import { hasTeamAccess } from "./gate-policy.ts";

test("private NGO data requires an explicitly unlocked team session", () => {
  expect(hasTeamAccess({})).toBe(false);
  expect(hasTeamAccess({ unlocked: false })).toBe(false);
  expect(hasTeamAccess({ unlocked: true })).toBe(true);
});