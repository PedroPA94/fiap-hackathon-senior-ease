import { describe, expect, it } from "vitest";

import {
  colorSchemes,
  defaultColors,
  getColorScheme,
  highContrastColors,
} from "../src";

const semanticGroups = [
  "background",
  "text",
  "primary",
  "border",
  "danger",
  "disabled",
  "focus",
] as const;

describe("color tokens", () => {
  it("exposes the default color scheme", () => {
    expect(colorSchemes.default).toBe(defaultColors);
    expect(getColorScheme("default")).toBe(defaultColors);
  });

  it("exposes the high contrast color scheme", () => {
    expect(colorSchemes.high).toBe(highContrastColors);
    expect(getColorScheme("high")).toBe(highContrastColors);
  });

  it("default scheme contains the main semantic groups", () => {
    for (const group of semanticGroups) {
      expect(defaultColors).toHaveProperty(group);
    }
  });

  it("high contrast scheme keeps the same semantic structure as default", () => {
    expect(Object.keys(highContrastColors)).toEqual(Object.keys(defaultColors));

    for (const group of semanticGroups) {
      expect(Object.keys(highContrastColors[group])).toEqual(
        Object.keys(defaultColors[group]),
      );
    }
  });

  it("keeps important palette values from the public tokens", () => {
    expect(defaultColors.primary.default).toBe("#0D5261");
    expect(defaultColors.background.page).toBe("#F5FAFF");
    expect(defaultColors.background.surface).toBe("#FFFFFF");
  });

  it("changes relevant colors in the high contrast scheme", () => {
    expect(highContrastColors.text.default).not.toBe(defaultColors.text.default);
    expect(highContrastColors.primary.default).not.toBe(
      defaultColors.primary.default,
    );
    expect(highContrastColors.border.strong).not.toBe(
      defaultColors.border.strong,
    );
  });
});
