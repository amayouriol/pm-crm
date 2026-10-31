import { test, expect } from "bun:test";
import { exitView } from "./exit-view.ts";

test("leaving a view clears the profile and returns to profile selection", async () => {
  let profile = "Andrea Mayo";
  let destination = "/dashboard";
  const calls = [];
  await exitView({
    cancelQueries: async () => { calls.push("cancel"); },
    clearQueries: () => { calls.push("clear"); },
    clearProfile: () => { profile = null; calls.push("profile"); },
    showProfiles: async () => { destination = "/"; calls.push("selector"); },
  });
  expect(profile).toBeNull();
  expect(destination).toBe("/");
  expect(calls).toEqual(["cancel", "clear", "profile", "selector"]);
});