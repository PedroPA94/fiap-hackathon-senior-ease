import type { EntityId } from "@senior-ease/core";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  InlineFeedback,
} from "../../../../components";
import { ScrollableScreen } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationSession,
} from "../../../../providers";
import { ProfileBrand } from "../../components/profile-brand/profile-brand";
import { ProfileSelectorItem } from "../../components/profile-selector-item/profile-selector-item";

const selectProfileErrorMessage =
  "Não foi possível abrir este perfil. Selecione outro usuário.";

export type SelectProfileScreenProps = {
  onCreateProfile(): void;
};

export function SelectProfileScreen({
  onCreateProfile,
}: SelectProfileScreenProps) {
  const { theme } = useAccessibilityTheme();
  const session = useApplicationSession();
  const [selectedUserId, setSelectedUserId] = useState<EntityId | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  if (session.users.length === 0) {
    return null;
  }

  const handleSelect = (userId: EntityId) => {
    if (isSubmitting) {
      return;
    }

    setSelectedUserId(userId);
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (submittingRef.current || selectedUserId === null) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await session.selectProfile(selectedUserId);
    } catch {
      setErrorMessage(selectProfileErrorMessage);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollableScreen
      contentContainerStyle={[
        styles.content,
        { gap: theme.spacing.large },
      ]}
    >
      <ProfileBrand />

      <View style={{ gap: theme.spacing.small }}>
        <AppText
          accessibilityRole="header"
          variant="titleBold"
          style={styles.centeredText}
        >
          Quem está usando?
        </AppText>
        <AppText
          color="muted"
          variant="body"
          style={styles.centeredText}
        >
          Selecione seu perfil para continuar.
        </AppText>
      </View>

      <View
        accessibilityRole="radiogroup"
        style={{ gap: theme.spacing.small }}
      >
        {session.users.map((user) => (
          <ProfileSelectorItem
            disabled={isSubmitting}
            key={user.id}
            onPress={() => handleSelect(user.id)}
            selected={selectedUserId === user.id}
            user={user}
          />
        ))}
      </View>

      {errorMessage ? (
        <InlineFeedback variant="error">{errorMessage}</InlineFeedback>
      ) : null}

      <View style={styles.spacer} />

      <Button
        disabled={selectedUserId === null}
        loading={isSubmitting}
        onPress={() => void handleConfirm()}
      >
        Continuar
      </Button>

      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onCreateProfile}
        style={styles.createAction}
      >
        <AppText color="primary" variant="body" style={styles.createLabel}>
          Criar novo perfil
        </AppText>
      </Pressable>
    </ScrollableScreen>
  );
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
    flex: 1,
    minHeight: 32,
  },
  createAction: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  createLabel: {
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
