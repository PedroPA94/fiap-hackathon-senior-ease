import { DomainError } from "@senior-ease/core";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  InlineFeedback,
  TextField,
} from "../../../../components";
import { ScrollableScreen } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationSession,
} from "../../../../providers";
import { ProfileBrand } from "../../components/profile-brand/profile-brand";

const requiredNameMessage = "Digite seu nome para continuar.";
const createProfileErrorMessage =
  "Não foi possível criar o perfil. Tente novamente.";

export type CreateProfileScreenProps = {
  onSelectProfile?: () => void;
};

export function CreateProfileScreen({
  onSelectProfile,
}: CreateProfileScreenProps) {
  const { theme } = useAccessibilityTheme();
  const session = useApplicationSession();
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const submittingRef = useRef(false);
  const normalizedName = name.trim();
  const validationError =
    hasAttemptedSubmit && normalizedName.length === 0
      ? requiredNameMessage
      : undefined;

  const handleNameChange = (value: string) => {
    setName(value);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) {
      return;
    }

    setHasAttemptedSubmit(true);
    setErrorMessage(null);

    if (normalizedName.length === 0) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await session.createProfile(normalizedName);
    } catch (error) {
      setErrorMessage(getCreateProfileErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollableScreen
      contentContainerStyle={[styles.content, { gap: theme.spacing.large }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <ProfileBrand />

      <View style={{ gap: theme.spacing.small }}>
        <AppText
          accessibilityRole="header"
          variant="titleBold"
          style={styles.centeredText}
        >
          Vamos começar?
        </AppText>
        <AppText color="muted" variant="body" style={styles.centeredText}>
          Digite seu nome para personalizar sua experiência.
        </AppText>
      </View>

      <TextField
        autoCapitalize="words"
        autoComplete="name"
        disabled={isSubmitting}
        errorMessage={validationError}
        label="Seu nome"
        maxLength={80}
        onChangeText={handleNameChange}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="Ex.: Maria Helena"
        required
        returnKeyType="done"
        value={name}
      />

      {errorMessage ? (
        <InlineFeedback variant="error">{errorMessage}</InlineFeedback>
      ) : null}

      <View style={styles.spacer} />

      <Button loading={isSubmitting} onPress={() => void handleSubmit()}>
        Continuar
      </Button>

      {session.users.length > 0 && onSelectProfile ? (
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onSelectProfile}
          style={styles.selectAction}
        >
          <AppText color="primary" variant="body" style={styles.selectLabel}>
            Selecionar perfil existente
          </AppText>
        </Pressable>
      ) : null}
    </ScrollableScreen>
  );
}

function getCreateProfileErrorMessage(error: unknown): string {
  if (
    error instanceof DomainError &&
    error.code === "USER_PROFILE_NAME_REQUIRED"
  ) {
    return requiredNameMessage;
  }

  return createProfileErrorMessage;
}

const styles = StyleSheet.create({
  content: {
    minHeight: "100%",
    paddingTop: 48,
  },
  centeredText: {
    textAlign: "center",
  },
  spacer: {
    minHeight: 12,
  },
  selectAction: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  selectLabel: {
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
