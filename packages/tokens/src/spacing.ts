import type { SpacingPreference } from "@senior-ease/core";

export const baseSpacing = {
  none: 0,
  xsmall: 4,
  small: 8,
  regular: 12,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

export type SpacingToken = keyof typeof baseSpacing;

export type SpacingScale = Record<SpacingToken, number>;

export const spacing: SpacingScale = baseSpacing;

const spacingMultiplier: Record<SpacingPreference, number> = {
  comfortable: 1,
  wide: 1.25,
  extraWide: 1.5,
};

export function createSpacingScale(
  spacingPreference: SpacingPreference,
): SpacingScale {
  const multiplier = spacingMultiplier[spacingPreference];

  const spacingScale: SpacingScale = {} as SpacingScale;

  for (const [key, value] of Object.entries(baseSpacing)) {
    spacingScale[key as SpacingToken] = Math.round(value * multiplier);
  }

  return spacingScale;
}
