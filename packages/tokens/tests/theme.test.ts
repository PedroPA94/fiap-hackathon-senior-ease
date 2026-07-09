import { describe, expect, it } from "vitest";

import { defaultAccessibilityPreferences } from "@senior-ease/core";

import {
  borderStyle,
  borderWidth,
  breakpoints,
  createAccessibilityTheme,
  defaultColors,
  highContrastColors,
  radius,
} from "../src";

describe("accessibility theme", () => {
  it("creates a theme with the public token groups and preference flags", () => {
    const theme = createAccessibilityTheme(defaultAccessibilityPreferences);

    expect(theme).toEqual(
      expect.objectContaining({
        typography: expect.any(Object),
        spacing: expect.any(Object),
        colors: expect.any(Object),
        radius,
        borderWidth,
        borderStyle,
        breakpoints,
        mode: defaultAccessibilityPreferences.interfaceMode,
        enhancedFeedback: defaultAccessibilityPreferences.enhancedFeedback,
        confirmCriticalActions:
          defaultAccessibilityPreferences.confirmCriticalActions,
      }),
    );
  });

  it("uses fontSize preference to create typography", () => {
    const normal = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      fontSize: "normal",
    });
    const large = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      fontSize: "large",
    });

    expect(large.typography.body.fontSize).toBeGreaterThan(
      normal.typography.body.fontSize,
    );
  });

  it("uses spacing preference to create spacing", () => {
    const comfortable = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      spacing: "comfortable",
    });
    const wide = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      spacing: "wide",
    });

    expect(wide.spacing.regular).toBeGreaterThan(comfortable.spacing.regular);
  });

  it("uses contrast preference to create colors", () => {
    const defaultTheme = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      contrast: "default",
    });
    const highTheme = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      contrast: "high",
    });

    expect(defaultTheme.colors).toBe(defaultColors);
    expect(highTheme.colors).toBe(highContrastColors);
    expect(highTheme.colors.text.default).not.toBe(
      defaultTheme.colors.text.default,
    );
  });

  it("preserves interface mode and behavior flags in the theme", () => {
    const theme = createAccessibilityTheme({
      ...defaultAccessibilityPreferences,
      interfaceMode: "advanced",
      enhancedFeedback: true,
      confirmCriticalActions: false,
    });

    expect(theme.mode).toBe("advanced");
    expect(theme.enhancedFeedback).toBe(true);
    expect(theme.confirmCriticalActions).toBe(false);
  });
});
