import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@senior-ease/core";

import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
} from "./accessibility-theme-provider";

const updatedPreferences: AccessibilityPreferences = {
  fontSize: "extra",
  spacing: "extraWide",
  contrast: "high",
  interfaceMode: "advanced",
  enhancedFeedback: false,
  confirmCriticalActions: false,
  remindersEnabled: true,
  reminderAdvance: "oneDay",
};

function ThemeConsumer() {
  const { preferences, resetPreferences, setPreferences, theme } =
    useAccessibilityTheme();

  return (
    <View>
      <Text testID="preferences">{JSON.stringify(preferences)}</Text>
      <Text testID="font-size">{preferences.fontSize}</Text>
      <Text testID="body-size">{theme.typography.body.fontSize}</Text>
      <Text testID="spacing">{theme.spacing.medium}</Text>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="enhanced-feedback">
        {String(preferences.enhancedFeedback)}
      </Text>
      <Text testID="confirm-critical-actions">
        {String(preferences.confirmCriticalActions)}
      </Text>
      <Text testID="reminders-enabled">
        {String(preferences.remindersEnabled)}
      </Text>
      <Text testID="reminder-advance">{preferences.reminderAdvance}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setPreferences(updatedPreferences)}
      >
        <Text>Atualizar preferências</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={resetPreferences}>
        <Text>Restaurar preferências</Text>
      </Pressable>
    </View>
  );
}

function MissingProviderConsumer() {
  useAccessibilityTheme();

  return null;
}

function renderThemeConsumer() {
  return render(
    <AccessibilityThemeProvider>
      <ThemeConsumer />
    </AccessibilityThemeProvider>,
  );
}

describe("AccessibilityThemeProvider", () => {
  it("starts with the complete default preferences", () => {
    renderThemeConsumer();

    expect(screen.getByTestId("preferences")).toHaveTextContent(
      JSON.stringify(defaultAccessibilityPreferences),
    );
  });

  it("creates the accessibility theme from the defaults", () => {
    renderThemeConsumer();

    expect(screen.getByTestId("font-size")).toHaveTextContent("normal");
    expect(screen.getByTestId("body-size")).toHaveTextContent("16");
    expect(screen.getByTestId("spacing")).toHaveTextContent("16");
    expect(screen.getByTestId("mode")).toHaveTextContent("basic");
  });

  it("updates the complete preferences and recalculates the theme", () => {
    renderThemeConsumer();

    fireEvent.press(
      screen.getByRole("button", { name: "Atualizar preferências" }),
    );

    expect(screen.getByTestId("font-size")).toHaveTextContent("extra");
    expect(screen.getByTestId("body-size")).toHaveTextContent("24");
    expect(screen.getByTestId("spacing")).toHaveTextContent("24");
    expect(screen.getByTestId("mode")).toHaveTextContent("advanced");
    expect(screen.getByTestId("enhanced-feedback")).toHaveTextContent("false");
    expect(screen.getByTestId("confirm-critical-actions")).toHaveTextContent(
      "false",
    );
    expect(screen.getByTestId("reminders-enabled")).toHaveTextContent("true");
    expect(screen.getByTestId("reminder-advance")).toHaveTextContent("oneDay");
  });

  it("restores the default preferences and theme", () => {
    renderThemeConsumer();
    fireEvent.press(
      screen.getByRole("button", { name: "Atualizar preferências" }),
    );

    fireEvent.press(
      screen.getByRole("button", { name: "Restaurar preferências" }),
    );

    expect(screen.getByTestId("preferences")).toHaveTextContent(
      JSON.stringify(defaultAccessibilityPreferences),
    );
    expect(screen.getByTestId("body-size")).toHaveTextContent("16");
    expect(screen.getByTestId("spacing")).toHaveTextContent("16");
    expect(screen.getByTestId("mode")).toHaveTextContent("basic");
  });

  it("throws a clear error when the hook is used outside the provider", () => {
    expect(() => render(<MissingProviderConsumer />)).toThrow(
      "useAccessibilityTheme must be used within an AccessibilityThemeProvider.",
    );
  });
});
