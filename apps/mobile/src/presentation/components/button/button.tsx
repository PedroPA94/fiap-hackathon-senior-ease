import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import type { AccessibilityTheme } from "@senior-ease/tokens";

import { useAccessibilityTheme } from "../../providers";
import { AppText, type AppTextColor } from "../app-text/app-text";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";

export type ButtonProps = Omit<
  PressableProps,
  "children" | "disabled" | "style"
> & {
  children: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityState,
  onPress,
  style,
  ...pressableProps
}: ButtonProps) {
  const { theme } = useAccessibilityTheme();
  const isDisabled = disabled || loading;
  const contentColor = getContentColor(variant, isDisabled);

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: 48,
          paddingHorizontal: theme.spacing.large,
          paddingVertical: theme.spacing.regular,
          borderRadius: theme.radius.medium,
          borderWidth: theme.borderWidth.regular,
        },
        getVariantStyle(theme, variant, pressed, isDisabled),
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <AppText
        color={contentColor}
        variant="bodyBold"
        style={[styles.label, loading && styles.hiddenLabel]}
      >
        {children}
      </AppText>

      {loading ? (
        <ActivityIndicator
          accessibilityElementsHidden
          color={theme.colors.disabled.text}
          importantForAccessibility="no-hide-descendants"
          size="small"
          style={styles.indicator}
          testID="loading-indicator"
        />
      ) : null}
    </Pressable>
  );
}

function getContentColor(
  variant: ButtonVariant,
  disabled: boolean,
): AppTextColor {
  if (disabled) {
    return "disabled";
  }

  if (variant === "primary" || variant === "danger") {
    return "inverse";
  }

  if (variant === "dangerGhost") {
    return "danger";
  }

  return "primary";
}

function getVariantStyle(
  theme: AccessibilityTheme,
  variant: ButtonVariant,
  pressed: boolean,
  disabled: boolean,
): ViewStyle {
  if (disabled) {
    return {
      backgroundColor: theme.colors.disabled.background,
      borderColor: theme.colors.disabled.background,
    };
  }

  switch (variant) {
    case "secondary":
      return {
        backgroundColor: theme.colors.primary.soft,
        borderColor: pressed
          ? theme.colors.primary.default
          : theme.colors.primary.soft,
      };
    case "ghost":
      return {
        backgroundColor: pressed ? theme.colors.primary.soft : "transparent",
        borderColor: theme.colors.primary.default,
      };
    case "danger":
      return {
        backgroundColor: pressed
          ? theme.colors.danger.strong
          : theme.colors.danger.default,
        borderColor: pressed
          ? theme.colors.danger.strong
          : theme.colors.danger.default,
      };
    case "dangerGhost":
      return {
        backgroundColor: pressed ? theme.colors.danger.soft : "transparent",
        borderColor: theme.colors.danger.default,
      };
    default:
      return {
        backgroundColor: pressed
          ? theme.colors.primary.strong
          : theme.colors.primary.default,
        borderColor: pressed
          ? theme.colors.primary.strong
          : theme.colors.primary.default,
      };
  }
}

const styles = StyleSheet.create({
  button: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
  hiddenLabel: {
    opacity: 0,
  },
  indicator: {
    position: "absolute",
  },
});
