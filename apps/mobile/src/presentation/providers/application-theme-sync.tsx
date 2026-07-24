import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Button, InlineFeedback } from "../components";
import { Screen } from "../layout";
import { LoadingScreen } from "../screens/loading/loading-screen";
import { useAccessibilityTheme } from "./accessibility-theme-provider";
import { useApplicationContainer } from "./application-container-provider";
import { useApplicationSession } from "./application-session-provider";

export type ApplicationThemeSyncProps = {
  children: ReactNode;
};

export function ApplicationThemeSync({
  children,
}: ApplicationThemeSyncProps) {
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { resetPreferences, setPreferences, theme } =
    useAccessibilityTheme();
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const requestIdRef = useRef(0);
  const currentUserId = session.currentUser?.id ?? null;

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!currentUserId) {
      resetPreferences();
      setLoadedUserId(null);
      setFailedUserId(null);
      return;
    }

    setFailedUserId(null);

    void useCases.accessibilityPreferences.get
      .execute({ userId: currentUserId })
      .then((preferences) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setPreferences(preferences);
        setLoadedUserId(currentUserId);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setFailedUserId(currentUserId);
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [
    currentUserId,
    resetPreferences,
    retryVersion,
    setPreferences,
    useCases.accessibilityPreferences.get,
  ]);

  if (currentUserId && failedUserId === currentUserId) {
    return (
      <Screen>
        <View
          style={[
            styles.centered,
            { gap: theme.spacing.large },
          ]}
        >
          <InlineFeedback variant="error">
            Não foi possível carregar suas preferências. Tente novamente.
          </InlineFeedback>
          <Button onPress={() => setRetryVersion((version) => version + 1)}>
            Tentar novamente
          </Button>
        </View>
      </Screen>
    );
  }

  if (currentUserId && loadedUserId !== currentUserId) {
    return <LoadingScreen />;
  }

  return children;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
  },
});
