import { useState } from "react";
import type { AccessibilityTheme } from "@senior-ease/tokens";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from "react-native";

import { useAccessibilityTheme } from "../../providers";
import { getAppFontFamily } from "../app-text/app-font";
import { AppText } from "../app-text/app-text";

export type TextFieldProps = Omit<
  TextInputProps,
  "editable" | "onChangeText" | "value"
> & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  errorMessage?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  errorMessage,
  hint,
  required = false,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
  accessibilityState,
  multiline = false,
  onBlur,
  onFocus,
  style,
  ...inputProps
}: TextFieldProps) {
  const { theme } = useAccessibilityTheme();
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(errorMessage);
  const borderStyle = getBorderStyle(theme, focused, invalid, disabled);

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={{ gap: theme.spacing.small }}>
      <AppText color={disabled ? "disabled" : "default"} variant="helperBold">
        {required ? `${label} *` : label}
      </AppText>

      <TextInput
        {...inputProps}
        accessibilityHint={accessibilityHint ?? (invalid ? undefined : hint)}
        accessibilityLabel={
          accessibilityLabel ??
          (required ? `${label}, campo obrigatório` : label)
        }
        accessibilityState={{
          ...accessibilityState,
          disabled,
        }}
        allowFontScaling
        aria-invalid={invalid}
        editable={!disabled}
        multiline={multiline}
        onBlur={handleBlur}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        placeholderTextColor={
          disabled ? theme.colors.disabled.text : theme.colors.text.muted
        }
        style={[
          styles.input,
          {
            minHeight: multiline ? 96 : 56,
            paddingHorizontal: theme.spacing.medium,
            paddingVertical: theme.spacing.regular,
            color: disabled
              ? theme.colors.disabled.text
              : theme.colors.text.default,
            backgroundColor: disabled
              ? theme.colors.disabled.background
              : theme.colors.background.surface,
            borderRadius: theme.radius.medium,
            fontFamily: getAppFontFamily(theme.typography.body.fontWeight),
            fontSize: theme.typography.body.fontSize,
            fontWeight: "400",
            lineHeight: theme.typography.body.lineHeight,
          },
          borderStyle,
          multiline && styles.multiline,
          style,
        ]}
        value={value}
      />

      {invalid ? (
        <AppText
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          color="danger"
          variant="caption"
        >
          {errorMessage}
        </AppText>
      ) : hint ? (
        <AppText color="muted" variant="caption">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function getBorderStyle(
  theme: AccessibilityTheme,
  focused: boolean,
  invalid: boolean,
  disabled: boolean,
): TextStyle {
  if (invalid) {
    return {
      borderColor: theme.colors.danger.default,
      borderWidth: theme.borderWidth.strong,
    };
  }

  if (focused) {
    return {
      borderColor: theme.colors.focus.default,
      borderWidth: theme.borderWidth.strong,
    };
  }

  return {
    borderColor: disabled
      ? theme.colors.text.disabled
      : theme.colors.border.default,
    borderWidth: theme.borderWidth.regular,
  };
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
  },
  multiline: {
    textAlignVertical: "top",
  },
});
