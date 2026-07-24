import { StyleSheet, View } from "react-native";

import { useAccessibilityTheme } from "../../providers";
import { AppText } from "../app-text/app-text";
import { Button } from "../button/button";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[styles.container, { gap: theme.spacing.medium }]}
    >
      <AppText accessibilityRole="header" variant="titleBold">
        {title}
      </AppText>
      {description ? (
        <AppText color="muted">{description}</AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
});
