import { describe, expect, it } from "vitest";

import { baseSpacing, createSpacingScale } from "../src";

const mainSpacingTokens = [
  "none",
  "xsmall",
  "small",
  "regular",
  "medium",
  "large",
  "xlarge",
] as const;

describe("spacing tokens", () => {
  it("keeps the base scale for comfortable preference", () => {
    expect(createSpacingScale("comfortable")).toEqual(baseSpacing);
  });

  it("increases spacing for wide preference compared to comfortable", () => {
    const comfortable = createSpacingScale("comfortable");
    const wide = createSpacingScale("wide");

    expect(wide.regular).toBeGreaterThan(comfortable.regular);
    expect(wide.large).toBeGreaterThan(comfortable.large);
  });

  it("increases spacing more for extraWide preference than wide", () => {
    const wide = createSpacingScale("wide");
    const extraWide = createSpacingScale("extraWide");

    expect(extraWide.regular).toBeGreaterThan(wide.regular);
    expect(extraWide.xlarge).toBeGreaterThan(wide.xlarge);
  });

  it("keeps none as zero for every preference", () => {
    expect(createSpacingScale("comfortable").none).toBe(0);
    expect(createSpacingScale("wide").none).toBe(0);
    expect(createSpacingScale("extraWide").none).toBe(0);
  });

  it("contains the main spacing tokens from the public scale", () => {
    const spacing = createSpacingScale("comfortable");

    for (const token of mainSpacingTokens) {
      expect(spacing).toHaveProperty(token);
    }
  });

  it("preserves the implemented multiplier rule", () => {
    const wide = createSpacingScale("wide");
    const extraWide = createSpacingScale("extraWide");

    expect(wide.regular).toBe(Math.round(baseSpacing.regular * 1.25));
    expect(extraWide.regular).toBe(Math.round(baseSpacing.regular * 1.5));
  });
});
