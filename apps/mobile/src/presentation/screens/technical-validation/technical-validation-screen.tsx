import {
  defaultAccessibilityPreferences,
  parseActivity,
} from "@senior-ease/core";
import {
  createAccessibilityTheme,
  radius,
  spacing,
  typography,
} from "@senior-ease/tokens";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const technicalActivity = parseActivity({
  id: "technical-activity",
  userId: "technical-user",
  title: "Validação Mobile",
  description: "Validação da integração com o pacote compartilhado.",
  date: "2026-07-23",
  time: "09:00",
  steps: [
    {
      id: "technical-step",
      description: "Abrir o aplicativo no Expo Go",
      order: 1,
    },
  ],
  createdAt: "2026-07-23T12:00:00.000Z",
  updatedAt: "2026-07-23T12:00:00.000Z",
});

const technicalTheme = createAccessibilityTheme(
  defaultAccessibilityPreferences,
);

function toReactNativeFontWeight(fontWeight: number): 400 | 600 {
  return fontWeight >= 600 ? 600 : 400;
}

export function TechnicalValidationScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text accessibilityRole="header" style={styles.title}>
          SeniorEase Mobile
        </Text>

        <View style={styles.statusList}>
          <Text style={styles.status}>✓ Expo Router funcionando</Text>
          <Text style={styles.status}>✓ Core carregado</Text>
          <Text style={styles.status}>✓ Tokens carregados</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Atividade validada</Text>
          <Text style={styles.activityTitle}>{technicalActivity.title}</Text>
          <Text style={styles.description}>
            {technicalActivity.description}
          </Text>
        </View>

        <View style={styles.metrics}>
          <Text style={styles.metric}>
            Fonte do tema: {typography.bodyLarge.fontSize}
          </Text>
          <Text style={styles.metric}>Espaçamento: {spacing.medium}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: technicalTheme.colors.background.page,
  },
  content: {
    flexGrow: 1,
    gap: technicalTheme.spacing.large,
    padding: technicalTheme.spacing.large,
  },
  title: {
    color: technicalTheme.colors.primary.strong,
    fontSize: technicalTheme.typography.heading.fontSize,
    fontWeight: toReactNativeFontWeight(
      technicalTheme.typography.heading.fontWeight,
    ),
    lineHeight: technicalTheme.typography.heading.lineHeight,
  },
  statusList: {
    gap: technicalTheme.spacing.small,
  },
  status: {
    color: technicalTheme.colors.success.default,
    fontSize: technicalTheme.typography.bodyLarge.fontSize,
    lineHeight: technicalTheme.typography.bodyLarge.lineHeight,
  },
  card: {
    gap: technicalTheme.spacing.small,
    padding: technicalTheme.spacing.medium,
    backgroundColor: technicalTheme.colors.background.surface,
    borderColor: technicalTheme.colors.border.default,
    borderRadius: radius.medium,
    borderWidth: technicalTheme.borderWidth.regular,
  },
  eyebrow: {
    color: technicalTheme.colors.text.muted,
    fontSize: technicalTheme.typography.helper.fontSize,
    lineHeight: technicalTheme.typography.helper.lineHeight,
  },
  activityTitle: {
    color: technicalTheme.colors.text.default,
    fontSize: technicalTheme.typography.title.fontSize,
    fontWeight: toReactNativeFontWeight(
      technicalTheme.typography.title.fontWeight,
    ),
    lineHeight: technicalTheme.typography.title.lineHeight,
  },
  description: {
    color: technicalTheme.colors.text.muted,
    fontSize: technicalTheme.typography.body.fontSize,
    lineHeight: technicalTheme.typography.body.lineHeight,
  },
  metrics: {
    gap: technicalTheme.spacing.xsmall,
    padding: technicalTheme.spacing.medium,
    backgroundColor: technicalTheme.colors.background.surfaceSoft,
    borderRadius: radius.medium,
  },
  metric: {
    color: technicalTheme.colors.text.default,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
});
