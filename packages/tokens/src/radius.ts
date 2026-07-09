export const radius = {
  none: 0,
  medium: 14,
  large: 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
