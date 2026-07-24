import { Pressable, StyleSheet, View } from "react-native";

import { useAccessibilityTheme } from "../../providers";
import { AppText } from "../app-text/app-text";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onChange(value: T): void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      accessibilityState={{ disabled }}
      style={{ gap: theme.spacing.small }}
    >
      <AppText variant="bodyBold">{label}</AppText>

      <View
        style={[
          styles.options,
          { gap: Math.max(theme.spacing.small, 6) },
        ]}
        testID="segmented-control-options"
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  minHeight: 48,
                  paddingHorizontal: theme.spacing.medium,
                  paddingVertical: theme.spacing.small,
                  backgroundColor: selected
                    ? theme.colors.primary.default
                    : theme.colors.background.surface,
                  borderColor: selected
                    ? theme.colors.primary.default
                    : theme.colors.border.default,
                  borderRadius: theme.radius.large,
                  borderWidth: theme.borderWidth.regular,
                  opacity: disabled ? 0.6 : 1,
                },
                pressed && !disabled && styles.pressed,
              ]}
            >
              <AppText
                color={selected ? "inverse" : "default"}
                numberOfLines={1}
                variant={selected ? "helperBold" : "helper"}
                style={styles.optionLabel}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: "row",
    alignItems: "stretch",
    flexWrap: "wrap",
  },
  option: {
    flexBasis: "auto",
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  optionLabel: {
    flexShrink: 0,
    textAlign: "center",
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
});
