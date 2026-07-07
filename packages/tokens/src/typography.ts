import type { FontSizePreference } from '@senior-ease/core';

export const fontSize = {
  sm: 12,
  base: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

export type FontSizeToken = keyof typeof fontSize;

export type TypographyScale = Record<FontSizeToken, number>;

const fontSizeOffset: Record<FontSizePreference, number> = {
  normal: 0,
  large: 4,
  extra: 8,
};

export function createTypographyScale(
  preference: FontSizePreference
): TypographyScale {
  const offset = fontSizeOffset[preference];

  return Object.fromEntries(
    Object.entries(fontSize).map(([key, value]) => [key, value + offset])
  ) as TypographyScale;
}
