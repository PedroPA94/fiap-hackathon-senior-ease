import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../../src/presentation/components";
import {
  useAccessibilityTheme,
  useApplicationSession,
} from "../../src/presentation/providers";
import { LoadingScreen } from "../../src/presentation/screens/loading/loading-screen";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const session = useApplicationSession();
  const { theme } = useAccessibilityTheme();

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.status !== "ready") {
    return <Redirect href="/" />;
  }

  const tabBarHeight =
    48 +
    theme.typography.caption.lineHeight * 2 +
    theme.spacing.small +
    Math.max(insets.bottom, theme.spacing.small);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.default,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: theme.spacing.small,
          paddingBottom: Math.max(insets.bottom, theme.spacing.small),
          backgroundColor: theme.colors.background.surface,
          borderTopColor: theme.colors.border.default,
          borderTopWidth: theme.borderWidth.regular,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarAccessibilityLabel: "Aba Início",
          tabBarIcon: ({ focused }) => (
            <TabMarker focused={focused} symbol="⌂" />
          ),
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>
              Início
            </TabLabel>
          ),
        }}
      />
      <Tabs.Screen
        name="personalization"
        options={{
          title: "Personalização",
          tabBarAccessibilityLabel: "Aba Personalização",
          tabBarIcon: ({ focused }) => (
            <TabMarker focused={focused} symbol="⚙" />
          ),
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>
              Personalização
            </TabLabel>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Atividades",
          tabBarAccessibilityLabel: "Aba Atividades",
          tabBarIcon: ({ focused }) => (
            <TabMarker focused={focused} symbol="✓" />
          ),
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>
              Atividades
            </TabLabel>
          ),
        }}
      />
    </Tabs>
  );
}

function TabMarker({
  focused,
  symbol,
}: {
  focused: boolean;
  symbol: string;
}) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.marker,
        {
          borderTopColor: focused
            ? theme.colors.primary.default
            : "transparent",
        },
      ]}
    >
      <AppText
        color={focused ? "primary" : "muted"}
        variant={focused ? "bodyBold" : "body"}
      >
        {symbol}
      </AppText>
    </View>
  );
}

function TabLabel({
  children,
  color,
  focused,
}: {
  children: string;
  color: string;
  focused: boolean;
}) {
  return (
    <AppText
      style={[styles.tabLabel, { color }]}
      variant={focused ? "captionBold" : "caption"}
    >
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    minHeight: 48,
  },
  marker: {
    width: 48,
    alignItems: "center",
    borderTopWidth: 3,
    paddingTop: 2,
  },
  tabLabel: {
    flexShrink: 1,
    textAlign: "center",
  },
});
