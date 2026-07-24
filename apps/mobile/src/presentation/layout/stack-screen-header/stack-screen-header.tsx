import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "../../components";
import { useAccessibilityTheme } from "../../providers";

export type StackScreenHeaderProps = {
  title: string;
  onBack(): void;
};

export function StackScreenHeader({
  title,
  onBack,
}: StackScreenHeaderProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: theme.colors.background.surface }}
    >
      <View
        style={[
          styles.content,
          {
            borderBottomColor: theme.colors.border.default,
            borderBottomWidth: theme.borderWidth.regular,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed
                ? theme.colors.primary.soft
                : "transparent",
              borderRadius: theme.radius.medium,
            },
          ]}
        >
          <AppText color="primary" variant="bodyLargeBold">
            ←
          </AppText>
        </Pressable>
        <AppText style={styles.title} variant="titleBold">
          {title}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    minWidth: 0,
    flex: 1,
  },
});
