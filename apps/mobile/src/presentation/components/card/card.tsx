import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAccessibilityTheme } from "../../providers";

export type CardPadding = "regular" | "compact";

export type CardProps = {
  children: ReactNode;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card({
  children,
  padding = "regular",
  style,
  testID,
}: CardProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding:
            padding === "compact"
              ? theme.spacing.regular
              : theme.spacing.medium,
          backgroundColor: theme.colors.background.surface,
          borderColor: theme.colors.border.default,
          borderRadius: theme.radius.medium,
          borderWidth: theme.borderWidth.regular,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
});
