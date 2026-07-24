import { parseActivity } from "@senior-ease/core";
import type { AccessibilityTheme } from "@senior-ease/tokens";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibilityTheme } from "../../providers";

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

function toReactNativeFontWeight(fontWeight: number): 400 | 600 {
  return fontWeight >= 600 ? 600 : 400;
}

export function TechnicalValidationScreen() {
  const { theme } = useAccessibilityTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
            Fonte do tema: {theme.typography.bodyLarge.fontSize}
          </Text>
          <Text style={styles.metric}>Espaçamento: {theme.spacing.medium}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AccessibilityTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.page,
    },
    content: {
      flexGrow: 1,
      gap: theme.spacing.large,
      padding: theme.spacing.large,
    },
    title: {
      color: theme.colors.primary.strong,
      fontSize: theme.typography.heading.fontSize,
      fontWeight: toReactNativeFontWeight(theme.typography.heading.fontWeight),
      lineHeight: theme.typography.heading.lineHeight,
    },
    statusList: {
      gap: theme.spacing.small,
    },
    status: {
      color: theme.colors.success.default,
      fontSize: theme.typography.bodyLarge.fontSize,
      lineHeight: theme.typography.bodyLarge.lineHeight,
    },
    card: {
      gap: theme.spacing.small,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border.default,
      borderRadius: theme.radius.medium,
      borderWidth: theme.borderWidth.regular,
    },
    eyebrow: {
      color: theme.colors.text.muted,
      fontSize: theme.typography.helper.fontSize,
      lineHeight: theme.typography.helper.lineHeight,
    },
    activityTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.title.fontSize,
      fontWeight: toReactNativeFontWeight(theme.typography.title.fontWeight),
      lineHeight: theme.typography.title.lineHeight,
    },
    description: {
      color: theme.colors.text.muted,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    metrics: {
      gap: theme.spacing.xsmall,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.background.surfaceSoft,
      borderRadius: theme.radius.medium,
    },
    metric: {
      color: theme.colors.text.default,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
  });
}
