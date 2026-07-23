import type { ContrastPreference } from "@senior-ease/core";

export const defaultColors = {
  background: {
    page: "#F5FAFF",
    surface: "#FFFFFF",
    surfaceSoft: "#E0F0F2",
  },

  text: {
    default: "#0F1A24",
    muted: "#5C6E80",
    inverse: "#FFFFFF",
    disabled: "#7A8794",
  },

  primary: {
    default: "#0D5261",
    strong: "#083E49",
    soft: "#E0F0F2",
  },

  border: {
    default: "#D6E0E8",
    strong: "#9AAFC0",
  },

  danger: {
    default: "#BF1414",
    strong: "#8F0F0F",
    soft: "#FDECEC",
  },

  success: {
    default: "#15803D",
    soft: "#EAF7EE",
  },

  warning: {
    default: "#B45309",
    soft: "#FFF4E5",
  },

  disabled: {
    background: "#DDDDDD",
    text: "#7A8794",
  },

  focus: {
    default: "#2563EB",
  },
} as const;

export const colors = defaultColors;

export const highContrastColors = {
  background: {
    page: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSoft: "#F8FAFC",
  },

  text: {
    default: "#000000",
    muted: "#1F2937",
    inverse: "#FFFFFF",
    disabled: "#4B5563",
  },

  primary: {
    default: "#083E49",
    strong: "#052E36",
    soft: "#D8F3F6",
  },

  border: {
    default: "#64748B",
    strong: "#0F172A",
  },

  danger: {
    default: "#991B1B",
    strong: "#7F1D1D",
    soft: "#FEE2E2",
  },

  success: {
    default: "#166534",
    soft: "#DCFCE7",
  },

  warning: {
    default: "#92400E",
    soft: "#FEF3C7",
  },

  disabled: {
    background: "#D1D5DB",
    text: "#374151",
  },

  focus: {
    default: "#1D4ED8",
  },
} as const;

export const colorSchemes = {
  default: defaultColors,
  high: highContrastColors,
} as const;

export type ColorScheme = (typeof colorSchemes)[ContrastPreference];

export function getColorScheme(
  contrastPreference: ContrastPreference,
): ColorScheme {
  return colorSchemes[contrastPreference];
}
