import { describe, expect, it } from "vitest";

import {
  baseFontSize,
  createTypographyScale,
  fontFamily,
  fontWeight,
  lineHeightMultiplier,
} from "../src";

const mainTextStyles = [
  "displayLarge",
  "display",
  "heading",
  "title",
  "bodyLarge",
  "body",
  "helper",
  "caption",
] as const;

describe("typography tokens", () => {
  it("creates the base typography scale for normal preference", () => {
    const typography = createTypographyScale("normal");

    expect(typography.body).toEqual({
      fontFamily: fontFamily.primary,
      fontSize: 16,
      lineHeight: Math.round(16 * lineHeightMultiplier),
      fontWeight: fontWeight.regular,
    });
    expect(typography.displayLarge.fontSize).toBe(baseFontSize.displayLarge);
    expect(typography.caption.fontSize).toBe(baseFontSize.caption);
  });

  it("increases font sizes for large preference compared to normal", () => {
    const normal = createTypographyScale("normal");
    const large = createTypographyScale("large");

    expect(large.body.fontSize).toBeGreaterThan(normal.body.fontSize);
    expect(large.title.fontSize).toBeGreaterThan(normal.title.fontSize);
  });

  it("increases font sizes more for extra preference than large", () => {
    const large = createTypographyScale("large");
    const extra = createTypographyScale("extra");

    expect(extra.body.fontSize).toBeGreaterThan(large.body.fontSize);
    expect(extra.display.fontSize).toBeGreaterThan(large.display.fontSize);
  });

  it("contains the main text styles with the expected fields", () => {
    const typography = createTypographyScale("normal");

    for (const styleName of mainTextStyles) {
      expect(typography[styleName]).toEqual(
        expect.objectContaining({
          fontFamily: expect.any(String),
          fontSize: expect.any(Number),
          lineHeight: expect.any(Number),
          fontWeight: expect.any(Number),
        }),
      );
    }
  });

  it("keeps body font size progression across accessibility preferences", () => {
    const normal = createTypographyScale("normal");
    const large = createTypographyScale("large");
    const extra = createTypographyScale("extra");

    expect(normal.body.fontSize).toBe(16);
    expect(large.body.fontSize).toBeGreaterThan(normal.body.fontSize);
    expect(extra.body.fontSize).toBeGreaterThan(large.body.fontSize);
  });

  it("updates lineHeight according to the fontSize rule", () => {
    const large = createTypographyScale("large");
    const extra = createTypographyScale("extra");

    expect(large.body.lineHeight).toBe(
      Math.round(large.body.fontSize * lineHeightMultiplier),
    );
    expect(extra.heading.lineHeight).toBe(
      Math.round(extra.heading.fontSize * lineHeightMultiplier),
    );
  });
});
