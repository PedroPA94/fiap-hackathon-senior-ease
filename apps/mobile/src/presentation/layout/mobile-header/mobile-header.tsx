import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "../../components";
import {
  useAccessibilityTheme,
  useApplicationSession,
} from "../../providers";

export function MobileHeader() {
  const { theme } = useAccessibilityTheme();
  const session = useApplicationSession();
  const [isClearing, setIsClearing] = useState(false);
  const clearingRef = useRef(false);
  const name = session.currentUser?.name ?? "";
  const initial = name.trim().charAt(0).toUpperCase();

  const handleClearProfile = async () => {
    if (clearingRef.current) {
      return;
    }

    clearingRef.current = true;
    setIsClearing(true);

    try {
      await session.clearCurrentProfile();
    } catch {
      // The current screen remains usable and the action can be retried.
    } finally {
      clearingRef.current = false;
      setIsClearing(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: theme.colors.background.surface }}
    >
      <View
        style={[
          styles.content,
          {
            gap: theme.spacing.regular,
            paddingHorizontal: 24,
            paddingVertical: 8,
            borderBottomColor: theme.colors.border.default,
            borderBottomWidth: theme.borderWidth.regular,
          },
        ]}
      >
        <AppText color="primary" variant="titleBold">
          SeniorEase
        </AppText>

        <Pressable
          accessibilityLabel={`Trocar perfil. Perfil atual: ${name}`}
          accessibilityRole="button"
          accessibilityState={{
            busy: isClearing,
            disabled: isClearing,
          }}
          disabled={isClearing}
          onPress={() => void handleClearProfile()}
          style={({ pressed }) => [
            styles.profile,
            {
              gap: theme.spacing.small,
              minHeight: 48,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
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
          <View style={styles.profileText}>
            <AppText variant="helperBold">{name}</AppText>
            <AppText color="primary" variant="caption">
              Trocar perfil
            </AppText>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    minWidth: 0,
    flexShrink: 1,
  },
});
