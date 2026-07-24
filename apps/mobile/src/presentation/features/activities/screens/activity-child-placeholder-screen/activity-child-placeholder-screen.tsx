import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../../../components";
import { StackScreenHeader } from "../../../../layout";
import { useAccessibilityTheme } from "../../../../providers";

export type ActivityChildPlaceholderScreenProps = {
  title: string;
  description: string;
};

export function ActivityChildPlaceholderScreen({
  title,
  description,
}: ActivityChildPlaceholderScreenProps) {
  const router = useRouter();
  const { theme } = useAccessibilityTheme();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <StackScreenHeader onBack={() => router.back()} title={title} />
      <View
        style={[
          styles.content,
          { gap: theme.spacing.medium },
        ]}
      >
        <AppText accessibilityRole="header" variant="titleBold">
          {title}
        </AppText>
        <AppText color="muted">{description}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
});
