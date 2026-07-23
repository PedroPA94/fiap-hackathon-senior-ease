import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type InterfaceMode,
} from "@senior-ease/core";

import { borderStyle, borderWidth } from "./border.js";
import { getColorScheme, type ColorScheme } from "./colors.js";
import { radius } from "./radius.js";
import { createSpacingScale, type SpacingScale } from "./spacing.js";
import { createTypographyScale, type TypographyScale } from "./typography.js";
import { breakpoints } from "./breakpoints.js";

export type AccessibilityTheme = {
  typography: TypographyScale;
  spacing: SpacingScale;
  colors: ColorScheme;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
  borderStyle: typeof borderStyle;
  breakpoints: typeof breakpoints;
  mode: InterfaceMode;
  enhancedFeedback: boolean;
  confirmCriticalActions: boolean;
};

export function createAccessibilityTheme(
  preferences: AccessibilityPreferences = defaultAccessibilityPreferences,
): AccessibilityTheme {
  return {
    typography: createTypographyScale(preferences.fontSize),
    spacing: createSpacingScale(preferences.spacing),
    colors: getColorScheme(preferences.contrast),
    radius,
    borderWidth,
    borderStyle,
    breakpoints,
    mode: preferences.interfaceMode,
    enhancedFeedback: preferences.enhancedFeedback,
    confirmCriticalActions: preferences.confirmCriticalActions,
  };
}
