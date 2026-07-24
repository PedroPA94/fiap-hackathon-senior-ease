import type {
  AccessibilityPreferences,
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from "@senior-ease/core";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  InlineFeedback,
  SegmentedControl,
  type SegmentedControlOption,
} from "../../../../components";
import { Screen, ScrollableScreen } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../../../providers";
import { LoadingScreen } from "../../../../screens/loading/loading-screen";

const loadErrorMessage =
  "Não foi possível carregar suas preferências. Tente novamente.";
const saveErrorMessage =
  "Não foi possível salvar suas preferências. Tente novamente.";

const fontSizeOptions: readonly SegmentedControlOption<FontSizePreference>[] = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "extra", label: "Extra" },
];

const spacingOptions: readonly SegmentedControlOption<SpacingPreference>[] = [
  { value: "comfortable", label: "Normal" },
  { value: "wide", label: "Grande" },
  { value: "extraWide", label: "Extra" },
];

const contrastOptions: readonly SegmentedControlOption<ContrastPreference>[] = [
  { value: "default", label: "Padrão" },
  { value: "high", label: "Alto" },
];

const interfaceModeOptions: readonly SegmentedControlOption<InterfaceMode>[] = [
  { value: "basic", label: "Básico" },
  { value: "advanced", label: "Avançado" },
];

export function PersonalizationSetupScreen() {
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { setPreferences: applyPreview, theme } = useAccessibilityTheme();
  const [preferences, setPreferences] =
    useState<AccessibilityPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialPreferencesRef = useRef<AccessibilityPreferences | null>(null);
  const hasSavedRef = useRef(false);
  const mountedRef = useRef(true);
  const loadIdRef = useRef(0);
  const savingRef = useRef(false);
  const currentUser = session.currentUser;

  const loadPreferences = useCallback(async () => {
    const loadId = ++loadIdRef.current;

    setIsLoading(true);
    setErrorMessage(null);

    if (!currentUser) {
      if (mountedRef.current && loadId === loadIdRef.current) {
        setIsLoading(false);
        setErrorMessage(loadErrorMessage);
      }
      return;
    }

    try {
      const loadedPreferences =
        await useCases.accessibilityPreferences.get.execute({
          userId: currentUser.id,
        });

      if (!mountedRef.current || loadId !== loadIdRef.current) {
        return;
      }

      initialPreferencesRef.current = loadedPreferences;
      setPreferences(loadedPreferences);
      applyPreview(loadedPreferences);
      setIsLoading(false);
    } catch {
      if (mountedRef.current && loadId === loadIdRef.current) {
        setPreferences(null);
        setIsLoading(false);
        setErrorMessage(loadErrorMessage);
      }
    }
  }, [applyPreview, currentUser, useCases.accessibilityPreferences.get]);

  useEffect(() => {
    mountedRef.current = true;
    void loadPreferences();

    return () => {
      mountedRef.current = false;
      loadIdRef.current += 1;

      if (!hasSavedRef.current && initialPreferencesRef.current) {
        applyPreview(initialPreferencesRef.current);
      }
    };
  }, [applyPreview, loadPreferences]);

  const updatePreference = <
    Key extends "fontSize" | "spacing" | "contrast" | "interfaceMode",
  >(
    key: Key,
    value: AccessibilityPreferences[Key],
  ) => {
    if (!preferences || isSaving) {
      return;
    }

    const nextPreferences: AccessibilityPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(nextPreferences);
    applyPreview(nextPreferences);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (savingRef.current || !preferences || !currentUser) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedPreferences =
        await useCases.accessibilityPreferences.update.execute({
          userId: currentUser.id,
          preferences,
        });

      hasSavedRef.current = true;
      setPreferences(savedPreferences);
      applyPreview(savedPreferences);
      await session.completeOnboarding();
    } catch {
      if (mountedRef.current) {
        setErrorMessage(saveErrorMessage);
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!preferences) {
    return (
      <Screen>
        <View
          style={[
            styles.centeredState,
            { gap: theme.spacing.large },
          ]}
        >
          <InlineFeedback variant="error">
            {errorMessage ?? loadErrorMessage}
          </InlineFeedback>
          <Button onPress={() => void loadPreferences()}>
            Tentar novamente
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <ScrollableScreen
      padded={false}
      contentContainerStyle={[
        styles.content,
        {
          gap: theme.spacing.large,
          padding: 24,
        },
      ]}
    >
      <PersonalizationHeader
        name={currentUser?.name ?? ""}
      />

      <View style={{ gap: theme.spacing.small }}>
        <AppText accessibilityRole="header" variant="titleBold">
          Vamos deixar a tela mais confortável para você
        </AppText>
        <AppText color="muted">
          Você pode mudar essas opções depois, a qualquer momento.
        </AppText>
      </View>

      {errorMessage ? (
        <InlineFeedback variant="error">{errorMessage}</InlineFeedback>
      ) : null}

      <View
        style={[
          styles.card,
          {
            gap: theme.spacing.medium,
            padding: theme.spacing.medium,
            backgroundColor: theme.colors.background.surface,
            borderColor: theme.colors.border.default,
            borderRadius: theme.radius.medium,
          },
        ]}
      >
        <AppText variant="titleBold">Configuração inicial</AppText>

        <SegmentedControl
          disabled={isSaving}
          label="Tamanho da fonte"
          onChange={(value) => updatePreference("fontSize", value)}
          options={fontSizeOptions}
          value={preferences.fontSize}
        />
        <SegmentedControl
          disabled={isSaving}
          label="Espaçamento"
          onChange={(value) => updatePreference("spacing", value)}
          options={spacingOptions}
          value={preferences.spacing}
        />
        <SegmentedControl
          disabled={isSaving}
          label="Contraste"
          onChange={(value) => updatePreference("contrast", value)}
          options={contrastOptions}
          value={preferences.contrast}
        />
        <SegmentedControl
          disabled={isSaving}
          label="Modo de exibição"
          onChange={(value) => updatePreference("interfaceMode", value)}
          options={interfaceModeOptions}
          value={preferences.interfaceMode}
        />
      </View>

      <Button
        loading={isSaving}
        onPress={() => void handleSubmit()}
      >
        Começar
      </Button>
    </ScrollableScreen>
  );
}

function PersonalizationHeader({ name }: { name: string }) {
  const { theme } = useAccessibilityTheme();
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.header,
        {
          gap: theme.spacing.medium,
          paddingBottom: theme.spacing.medium,
          borderBottomColor: theme.colors.border.default,
        },
      ]}
    >
      <AppText color="primary" variant="titleBold">
        SeniorEase
      </AppText>
      <View
        accessibilityLabel={`Perfil atual: ${name}`}
        accessible
        style={[styles.profile, { gap: theme.spacing.small }]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primary.soft,
              borderRadius: theme.radius.large,
            },
          ]}
        >
          <AppText color="primary" variant="helperBold">
            {initial}
          </AppText>
        </View>
        <AppText style={styles.profileName}>{name}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profile: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    flexShrink: 1,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
});
