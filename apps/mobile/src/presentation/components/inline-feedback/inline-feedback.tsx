import { StyleSheet, View } from "react-native";
import type { AccessibilityTheme } from "@senior-ease/tokens";

import { useAccessibilityTheme } from "../../providers";
import { AppText, type AppTextColor } from "../app-text/app-text";

export type InlineFeedbackVariant = "success" | "error" | "info" | "warning";

export type InlineFeedbackProps = {
  children: string;
  variant?: InlineFeedbackVariant;
};

const indicatorByVariant: Record<InlineFeedbackVariant, string> = {
  success: "✓",
  error: "×",
  info: "i",
  warning: "!",
};

const labelByVariant: Record<InlineFeedbackVariant, string> = {
  success: "Sucesso",
  error: "Erro",
  info: "Informação",
  warning: "Atenção",
};

export function InlineFeedback({
  children,
  variant = "info",
}: InlineFeedbackProps) {
  const { theme } = useAccessibilityTheme();
  const textColor = getTextColor(variant);

  return (
    <View
      accessibilityLabel={`${labelByVariant[variant]}: ${children}`}
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      accessibilityRole={variant === "error" ? "alert" : undefined}
      accessible
      style={[
        styles.container,
        {
          gap: theme.spacing.small,
          paddingHorizontal: theme.spacing.medium,
          paddingVertical: theme.spacing.regular,
          backgroundColor: getBackgroundColor(theme, variant),
          borderColor: getBorderColor(theme, variant),
          borderRadius: theme.radius.medium,
          borderWidth: theme.borderWidth.regular,
        },
      ]}
      testID="inline-feedback"
    >
      <AppText
        accessibilityElementsHidden
        color={textColor}
        importantForAccessibility="no"
        variant="bodyBold"
        style={styles.indicator}
      >
        {indicatorByVariant[variant]}
      </AppText>
      <AppText color={textColor} variant="helper" style={styles.message}>
        {children}
      </AppText>
    </View>
  );
}

function getTextColor(variant: InlineFeedbackVariant): AppTextColor {
  switch (variant) {
    case "success":
      return "success";
    case "error":
      return "danger";
    case "warning":
      return "warning";
    default:
      return "primary";
  }
}

function getBackgroundColor(
  theme: AccessibilityTheme,
  variant: InlineFeedbackVariant,
): string {
  switch (variant) {
    case "success":
      return theme.colors.success.soft;
    case "error":
      return theme.colors.danger.soft;
    case "warning":
      return theme.colors.warning.soft;
    default:
      return theme.colors.primary.soft;
  }
}

function getBorderColor(
  theme: AccessibilityTheme,
  variant: InlineFeedbackVariant,
): string {
  switch (variant) {
    case "success":
      return theme.colors.success.default;
    case "error":
      return theme.colors.danger.default;
    case "warning":
      return theme.colors.warning.default;
    default:
      return theme.colors.primary.default;
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 20,
    textAlign: "center",
  },
  message: {
    flex: 1,
    flexShrink: 1,
  },
});
