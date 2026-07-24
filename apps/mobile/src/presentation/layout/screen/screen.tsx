import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibilityTheme } from "../../providers";

export type AppStatusBarStyle = "auto" | "inverted" | "light" | "dark";

export type ScreenProps = ViewProps & {
  padded?: boolean;
  statusBarStyle?: AppStatusBarStyle;
};

export function Screen({
  children,
  padded = true,
  statusBarStyle = "dark",
  style,
  ...viewProps
}: ScreenProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <SafeAreaView
      {...viewProps}
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background.page },
        padded && { padding: theme.spacing.large },
        style,
      ]}
    >
      <StatusBar style={statusBarStyle} />
      {children}
    </SafeAreaView>
  );
}

export type ScrollableScreenProps = ScrollViewProps & {
  padded?: boolean;
  statusBarStyle?: AppStatusBarStyle;
};

export function ScrollableScreen({
  children,
  padded = true,
  statusBarStyle = "dark",
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  ...scrollViewProps
}: ScrollableScreenProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <StatusBar style={statusBarStyle} />
      <ScrollView
        {...scrollViewProps}
        contentContainerStyle={[
          styles.scrollContent,
          padded && { padding: theme.spacing.large },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
