import { describe, it, expect } from "vitest";
import { SUPPORTED_LANGUAGES } from "@/i18n";

describe("i18n configuration", () => {
  it("includes major world languages", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("zh");
    expect(codes).toContain("es");
    expect(codes).toContain("ar");
    expect(codes).toContain("hi");
    expect(codes).toContain("ja");
    expect(codes).toContain("ko");
    expect(codes).toContain("fr");
    expect(codes).toContain("de");
  });

  it("has at least 25 languages", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(25);
  });

  it("has unique language codes", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("each language has flag and label", () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(lang.flag).toBeTruthy();
      expect(lang.label).toBeTruthy();
      expect(lang.code).toBeTruthy();
    });
  });
});
