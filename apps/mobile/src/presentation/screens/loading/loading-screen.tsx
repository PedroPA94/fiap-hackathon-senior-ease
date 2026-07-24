import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "../../components";
import { Screen } from "../../layout";
import { useAccessibilityTheme } from "../../providers";

export type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({
  message = "Preparando tudo para você...",
}: LoadingScreenProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <Screen padded={false}>
      <View
        accessibilityLabel={message}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityValue={{ text: message }}
        accessible
        style={[
          styles.content,
          {
            gap: theme.spacing.large,
            padding: theme.spacing.large,
          },
        ]}
      >
        <AppText color="primary" variant="titleBold">
          SeniorEase
        </AppText>
        <ActivityIndicator
          accessibilityElementsHidden
          color={theme.colors.primary.default}
          importantForAccessibility="no-hide-descendants"
          size="large"
          testID="loading-indicator"
        />
        <AppText color="muted" variant="body" style={styles.message}>
          {message}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    maxWidth: 220,
    textAlign: "center",
  },
});
