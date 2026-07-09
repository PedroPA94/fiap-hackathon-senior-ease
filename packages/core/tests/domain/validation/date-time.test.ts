import { describe, expect, it } from "vitest";

import { DomainError, normalizeDateOnly, normalizeOptionalTime } from "../../../src/domain";

describe("date and time validation", () => {
  describe("normalizeDateOnly", () => {
    it("accepts YYYY-MM-DD", () => {
      expect(normalizeDateOnly("2026-07-09", "ACTIVITY_DATE_INVALID")).toBe(
        "2026-07-09",
      );
    });

    it("rejects a full datetime", () => {
      expect(() =>
        normalizeDateOnly("2026-07-09T14:30:00.000Z", "ACTIVITY_DATE_INVALID"),
      ).toThrow(DomainError);
      expect(() =>
        normalizeDateOnly("2026-07-09T14:30:00.000Z", "ACTIVITY_DATE_INVALID"),
      ).toThrow(expect.objectContaining({ code: "ACTIVITY_DATE_INVALID" }));
    });

    it("rejects invalid text", () => {
      expect(() => normalizeDateOnly("hoje", "ACTIVITY_DATE_INVALID")).toThrow(
        DomainError,
      );
      expect(() => normalizeDateOnly("hoje", "ACTIVITY_DATE_INVALID")).toThrow(
        expect.objectContaining({ code: "ACTIVITY_DATE_INVALID" }),
      );
    });
  });

  describe("normalizeOptionalTime", () => {
    it("accepts HH:mm", () => {
      expect(normalizeOptionalTime("08:30", "ACTIVITY_TIME_INVALID")).toBe(
        "08:30",
      );
    });

    it("accepts undefined and returns undefined", () => {
      expect(
        normalizeOptionalTime(undefined, "ACTIVITY_TIME_INVALID"),
      ).toBeUndefined();
    });

    it("accepts empty text and returns undefined", () => {
      expect(normalizeOptionalTime("", "ACTIVITY_TIME_INVALID")).toBeUndefined();
    });

    it("accepts whitespace text and returns undefined", () => {
      expect(
        normalizeOptionalTime("   ", "ACTIVITY_TIME_INVALID"),
      ).toBeUndefined();
    });

    it("rejects HH:mm:ss", () => {
      expect(() =>
        normalizeOptionalTime("08:30:00", "ACTIVITY_TIME_INVALID"),
      ).toThrow(DomainError);
      expect(() =>
        normalizeOptionalTime("08:30:00", "ACTIVITY_TIME_INVALID"),
      ).toThrow(expect.objectContaining({ code: "ACTIVITY_TIME_INVALID" }));
    });

    it("rejects a full datetime", () => {
      expect(() =>
        normalizeOptionalTime(
          "2026-07-09T14:30:00.000Z",
          "ACTIVITY_TIME_INVALID",
        ),
      ).toThrow(DomainError);
      expect(() =>
        normalizeOptionalTime(
          "2026-07-09T14:30:00.000Z",
          "ACTIVITY_TIME_INVALID",
        ),
      ).toThrow(expect.objectContaining({ code: "ACTIVITY_TIME_INVALID" }));
    });
  });
});
