import { describe, it, expect } from "bun:test";
import { validateLinkedInInput } from "./linkedin-input";

describe("LinkedIn pasted content", () => {
  it("accepts pasted experience and competencies", () => {
    const text = "Analista financiera. Modelos financieros y Excel.";
    expect(validateLinkedInInput({ text }).text).toBe(text);
  });
  it("rejects an empty profile", () => {
    expect(() => validateLinkedInInput({ text: "  " })).toThrow();
  });
  it("requires profile content rather than a link", () => {
    expect(() => validateLinkedInInput({ text: "https://linkedin.com/in/postulante" })).toThrow();
  });
});