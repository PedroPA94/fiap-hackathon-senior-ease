import type { AccessibilityTheme, TextStyleToken } from "@senior-ease/tokens";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useAccessibilityTheme } from "../../providers";
import { getAppFontFamily } from "./app-font";

export type AppTextVariant = TextStyleToken;

export type AppTextColor =
  | "default"
  | "muted"
  | "inverse"
  | "primary"
  | "danger"
  | "success"
  | "warning"
  | "disabled";

export type AppTextProps = Omit<TextProps, "allowFontScaling"> & {
  variant?: AppTextVariant;
  color?: AppTextColor;
};

export function AppText({
  variant = "body",
  color = "default",
  style,
  ...textProps
}: AppTextProps) {
  const { theme } = useAccessibilityTheme();
  const typography = theme.typography[variant];
  const textStyle: TextStyle = {
    color: getTextColor(theme, color),
    fontFamily: getAppFontFamily(typography.fontWeight),
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight >= 600 ? "600" : "400",
    lineHeight: typography.lineHeight,
  };

  return <Text {...textProps} allowFontScaling style={[textStyle, style]} />;
}

function getTextColor(theme: AccessibilityTheme, color: AppTextColor): string {
  switch (color) {
    case "muted":
      return theme.colors.text.muted;
    case "inverse":
      return theme.colors.text.inverse;
    case "primary":
      return theme.colors.primary.default;
    case "danger":
      return theme.colors.danger.default;
    case "success":
      return theme.colors.success.default;
    case "warning":
      return theme.colors.warning.default;
    case "disabled":
      return theme.colors.disabled.text;
    default:
      return theme.colors.text.default;
  }
}
