import type { LocalUserSummary } from "../../../../../application/session";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "../../../../components";
import { useAccessibilityTheme } from "../../../../providers";

export type ProfileSelectorItemProps = {
  user: LocalUserSummary;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
};

export function ProfileSelectorItem({
  user,
  selected,
  onPress,
  disabled = false,
}: ProfileSelectorItemProps) {
  const { theme } = useAccessibilityTheme();
  const initial = user.name.trim().charAt(0).toLocaleUpperCase();

  return (
    <Pressable
      accessibilityLabel={user.name}
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          gap: theme.spacing.regular,
          paddingHorizontal: theme.spacing.medium,
          paddingVertical: theme.spacing.regular,
          backgroundColor: theme.colors.background.surface,
          borderColor: selected
            ? theme.colors.primary.default
            : theme.colors.border.default,
          borderRadius: theme.radius.medium,
          borderWidth: selected
            ? theme.borderWidth.strong
            : theme.borderWidth.regular,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.avatar,
          {
            backgroundColor: selected
              ? theme.colors.primary.default
              : theme.colors.primary.soft,
          },
        ]}
      >
        <AppText
          color={selected ? "inverse" : "primary"}
          variant="bodyBold"
        >
          {initial}
        </AppText>
      </View>

      <AppText
        variant={selected ? "bodyBold" : "body"}
        style={styles.name}
      >
        {user.name}
      </AppText>

      {selected ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.selectionIndicator,
            { backgroundColor: theme.colors.primary.default },
          ]}
          testID="selection-indicator"
        >
          <AppText color="inverse" variant="caption">
            ✓
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  avatar: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  name: {
    flex: 1,
    flexShrink: 1,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
