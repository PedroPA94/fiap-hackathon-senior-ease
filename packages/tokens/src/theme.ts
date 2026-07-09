import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type InterfaceMode,
} from "@senior-ease/core";

import { borderStyle, borderWidth } from "./border";
import { getColorScheme, type ColorScheme } from "./colors";
import { radius } from "./radius";
import { createSpacingScale, type SpacingScale } from "./spacing";
import { createTypographyScale, type TypographyScale } from "./typography";
import { breakpoints } from "./breakpoints";

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
