import { parseActivity } from "@senior-ease/core";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText, Button, InlineFeedback, TextField } from "../../components";
import { ScrollableScreen } from "../../layout";
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

export function TechnicalValidationScreen() {
  const { preferences, resetPreferences, setPreferences, theme } =
    useAccessibilityTheme();
  const [fieldValue, setFieldValue] = useState("");

  function toggleTechnicalTheme() {
    const usesExpandedTheme = preferences.fontSize === "extra";

    setPreferences({
      ...preferences,
      fontSize: usesExpandedTheme ? "normal" : "extra",
      spacing: usesExpandedTheme ? "comfortable" : "extraWide",
      contrast: usesExpandedTheme ? "default" : "high",
    });
  }

  return (
    <ScrollableScreen
      contentContainerStyle={{
        gap: theme.spacing.large,
      }}
      testID="technical-validation-screen"
    >
      <AppText accessibilityRole="header" variant="headingBold">
        SeniorEase Mobile
      </AppText>

      <InlineFeedback variant="success">
        Runtime visual acessível carregado.
      </InlineFeedback>

      <View style={{ gap: theme.spacing.small }}>
        <AppText color="success" variant="bodyLarge">
          ✓ Expo Router funcionando
        </AppText>
        <AppText color="success" variant="bodyLarge">
          ✓ Core carregado
        </AppText>
        <AppText color="success" variant="bodyLarge">
          ✓ Tokens carregados
        </AppText>
        <AppText color="success" variant="bodyLarge">
          ✓ Primitives carregados
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          {
            gap: theme.spacing.small,
            padding: theme.spacing.medium,
            backgroundColor: theme.colors.background.surface,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.medium,
            borderWidth: theme.borderWidth.regular,
          },
        ]}
      >
        <AppText color="muted" variant="helper">
          Atividade validada
        </AppText>
        <AppText variant="titleBold">{technicalActivity.title}</AppText>
        <AppText color="muted">{technicalActivity.description}</AppText>
      </View>

      <TextField
        autoCapitalize="words"
        hint="Este campo demonstra label, hint e teclado nativo."
        label="Campo técnico"
        onChangeText={setFieldValue}
        placeholder="Digite um texto"
        returnKeyType="done"
        value={fieldValue}
      />

      <View style={{ gap: theme.spacing.small }}>
        <Button onPress={toggleTechnicalTheme}>Alternar tema ampliado</Button>
        <Button onPress={resetPreferences} variant="ghost">
          Restaurar tema padrão
        </Button>
      </View>

      <View
        style={[
          styles.metrics,
          {
            gap: theme.spacing.xsmall,
            padding: theme.spacing.medium,
            backgroundColor: theme.colors.background.surfaceSoft,
            borderRadius: theme.radius.medium,
          },
        ]}
      >
        <AppText variant="helper">
          Fonte do tema: {theme.typography.bodyLarge.fontSize}
        </AppText>
        <AppText variant="helper">Espaçamento: {theme.spacing.medium}</AppText>
      </View>
    </ScrollableScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  metrics: {
    width: "100%",
  },
});
