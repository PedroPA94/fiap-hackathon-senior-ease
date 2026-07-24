import { Stack } from "expo-router";

import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
} from "../src/presentation/providers";

export default function RootLayout() {
  return (
    <ApplicationContainerProvider>
      <AccessibilityThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>
  );
}
