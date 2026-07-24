import { ScrollView, StyleSheet, View } from "react-native";

import { AppText, Card } from "../../../../components";
import { MobileHeader } from "../../../../layout";
import { useAccessibilityTheme } from "../../../../providers";

const preferenceLabels = {
  fontSize: {
    normal: "Normal",
    large: "Grande",
    extra: "Extra",
  },
  spacing: {
    comfortable: "Normal",
    wide: "Grande",
    extraWide: "Extra",
  },
  contrast: {
    default: "Padrão",
    high: "Alto",
  },
  interfaceMode: {
    basic: "Básico",
    advanced: "Avançado",
  },
} as const;

export function PersonalizationSummaryScreen() {
  const { preferences, theme } = useAccessibilityTheme();

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <MobileHeader />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { gap: theme.spacing.large },
        ]}
      >
        <View style={{ gap: theme.spacing.small }}>
          <AppText accessibilityRole="header" variant="titleBold">
            Personalização
          </AppText>
          <AppText color="muted">
            Seus ajustes visuais atuais. A edição completa estará disponível
            na próxima etapa.
          </AppText>
        </View>

        <Card style={{ gap: theme.spacing.medium }}>
          <PreferenceRow
            label="Tamanho da fonte"
            value={preferenceLabels.fontSize[preferences.fontSize]}
          />
          <PreferenceRow
            label="Espaçamento"
            value={preferenceLabels.spacing[preferences.spacing]}
          />
          <PreferenceRow
            label="Contraste"
            value={preferenceLabels.contrast[preferences.contrast]}
          />
          <PreferenceRow
            label="Modo de exibição"
            value={
              preferenceLabels.interfaceMode[preferences.interfaceMode]
            }
          />
        </Card>
      </ScrollView>
    </View>
  );
}

function PreferenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      style={[
        styles.preference,
        {
          gap: theme.spacing.small,
          borderBottomColor: theme.colors.border.default,
        },
      ]}
    >
      <AppText color="muted" variant="helper">
        {label}
      </AppText>
      <AppText variant="bodyBold">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  preference: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
