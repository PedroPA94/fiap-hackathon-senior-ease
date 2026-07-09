import { describe, expect, it } from "vitest";

import {
  defaultAccessibilityPreferences,
  DomainError,
  type AccessibilityPreferences,
} from "../../../src/domain";
import { validateAccessibilityPreferences } from "../../../src/domain/";

function expectDomainError(fn: () => unknown, code: string): void {
  expect(fn).toThrow(DomainError);
  expect(fn).toThrow(expect.objectContaining({ code }));
}

describe("AccessibilityPreferences value object", () => {
  it("accepts valid accessibility preferences", () => {
    expect(() =>
      validateAccessibilityPreferences({
        fontSize: "extra",
        contrast: "high",
        spacing: "extraWide",
        interfaceMode: "advanced",
        enhancedFeedback: true,
        confirmCriticalActions: false,
      }),
    ).not.toThrow();
  });

  it("accepts default accessibility preferences", () => {
    expect(() =>
      validateAccessibilityPreferences(defaultAccessibilityPreferences),
    ).not.toThrow();
  });

  it("rejects invalid fontSize", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          fontSize: "giant" as never,
        }),
      "ACCESSIBILITY_FONT_SIZE_INVALID",
    );
  });

  it("rejects invalid contrast", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          contrast: "maximum" as never,
        }),
      "ACCESSIBILITY_CONTRAST_INVALID",
    );
  });

  it("rejects invalid spacing", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          spacing: "roomy" as never,
        }),
      "ACCESSIBILITY_SPACING_INVALID",
    );
  });

  it("rejects invalid interfaceMode", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          interfaceMode: "expert" as never,
        }),
      "ACCESSIBILITY_INTERFACE_MODE_INVALID",
    );
  });

  it("rejects non boolean enhancedFeedback", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          enhancedFeedback: "yes" as never,
        }),
      "ACCESSIBILITY_ENHANCED_FEEDBACK_INVALID",
    );
  });

  it("rejects non boolean confirmCriticalActions", () => {
    expectDomainError(
      () =>
        validateAccessibilityPreferences({
          ...defaultAccessibilityPreferences,
          confirmCriticalActions: "yes" as never,
        }),
      "ACCESSIBILITY_CONFIRM_CRITICAL_ACTIONS_INVALID",
    );
  });

  it("keeps defaultAccessibilityPreferences as a valid value object shape", () => {
    const preferences: AccessibilityPreferences =
      defaultAccessibilityPreferences;

    expect(preferences).toEqual({
      fontSize: "normal",
      contrast: "default",
      spacing: "comfortable",
      interfaceMode: "basic",
      enhancedFeedback: true,
      confirmCriticalActions: true,
    });
  });
});
