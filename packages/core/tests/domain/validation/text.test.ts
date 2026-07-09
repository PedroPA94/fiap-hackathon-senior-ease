import { describe, expect, it } from "vitest";

import { DomainError, normalizeOptionalText, normalizeRequiredText } from "../../../src/domain";

describe("text validation", () => {
  describe("normalizeRequiredText", () => {
    it("removes surrounding whitespace and returns the normalized string", () => {
      expect(normalizeRequiredText("  Tomar remédio  ", "ACTIVITY_TITLE_REQUIRED")).toBe(
        "Tomar remédio",
      );
    });

    it("throws DomainError when value is empty", () => {
      expect(() => normalizeRequiredText("", "ACTIVITY_TITLE_REQUIRED")).toThrow(
        DomainError,
      );
      expect(() => normalizeRequiredText("", "ACTIVITY_TITLE_REQUIRED")).toThrow(
        expect.objectContaining({ code: "ACTIVITY_TITLE_REQUIRED" }),
      );
    });

    it("throws DomainError when value contains only whitespace", () => {
      expect(() =>
        normalizeRequiredText("   ", "ACTIVITY_STEP_DESCRIPTION_REQUIRED"),
      ).toThrow(DomainError);
      expect(() =>
        normalizeRequiredText("   ", "ACTIVITY_STEP_DESCRIPTION_REQUIRED"),
      ).toThrow(
        expect.objectContaining({ code: "ACTIVITY_STEP_DESCRIPTION_REQUIRED" }),
      );
    });
  });

  describe("normalizeOptionalText", () => {
    it("removes surrounding whitespace", () => {
      expect(normalizeOptionalText("  Depois do almoço  ")).toBe(
        "Depois do almoço",
      );
    });

    it("returns undefined when value is undefined", () => {
      expect(normalizeOptionalText(undefined)).toBeUndefined();
    });

    it("returns undefined when value is empty", () => {
      expect(normalizeOptionalText("")).toBeUndefined();
    });

    it("returns undefined when value contains only whitespace", () => {
      expect(normalizeOptionalText("   ")).toBeUndefined();
    });
  });
});
