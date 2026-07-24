import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";

import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
} from "../src/presentation/providers";
import { LoadingScreen } from "../src/presentation/screens/loading/loading-screen";

const appFonts = {
  Inter: Inter_400Regular,
  "Inter-SemiBold": Inter_600SemiBold,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);

  return (
    <ApplicationContainerProvider>
      <AccessibilityThemeProvider>
        {!fontsLoaded && !fontError ? (
          <LoadingScreen />
        ) : (
          <ApplicationSessionProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ApplicationSessionProvider>
        )}
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>
  );
}
