import { StyleSheet, View } from "react-native";

import { EmptyState } from "../../../../components";
import { MobileHeader } from "../../../../layout";
import { useAccessibilityTheme } from "../../../../providers";

export function ActivitiesPlaceholderScreen() {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <MobileHeader />
      <View style={styles.content}>
        <EmptyState
          description="A listagem e o acompanhamento das suas tarefas estarão disponíveis na próxima etapa."
          title="Atividades"
        />
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
    justifyContent: "center",
    padding: 24,
  },
});
