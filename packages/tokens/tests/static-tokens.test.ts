import { describe, expect, it } from "vitest";

import { borderStyle, borderWidth, breakpoints, radius } from "../src";

describe("static tokens", () => {
  it("defines ordered breakpoints", () => {
    expect(breakpoints.mobile).toBe(0);
    expect(breakpoints.tablet).toBeGreaterThan(breakpoints.mobile);
    expect(breakpoints.desktop).toBeGreaterThan(breakpoints.tablet);
  });

  it("defines the main radius tokens", () => {
    expect(radius).toEqual(
      expect.objectContaining({
        none: expect.any(Number),
        medium: expect.any(Number),
        large: expect.any(Number),
        pill: expect.any(Number),
      }),
    );
  });

  it("defines the main border width tokens", () => {
    expect(borderWidth).toEqual(
      expect.objectContaining({
        none: 0,
        regular: expect.any(Number),
        strong: expect.any(Number),
      }),
    );
  });

  it("defines the solid border style", () => {
    expect(borderStyle.solid).toBe("solid");
  });
});
