import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
} from "../../providers";
import { TechnicalValidationScreen } from "./technical-validation-screen";

function renderScreen() {
  return render(
    <AccessibilityThemeProvider>
      <TechnicalValidationScreen />
    </AccessibilityThemeProvider>,
  );
}

describe("TechnicalValidationScreen", () => {
  it("renders the screen identity with an accessible heading", () => {
    renderScreen();

    expect(
      screen.getByRole("header", { name: "SeniorEase Mobile" }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Expo Router funcionando/)).toBeOnTheScreen();
  });

  it("renders values produced by the shared packages", () => {
    renderScreen();

    expect(screen.getByText(/Core carregado/)).toBeOnTheScreen();
    expect(screen.getByText(/Tokens carregados/)).toBeOnTheScreen();
    expect(screen.getByText("Validação Mobile")).toBeOnTheScreen();
  });

  it("renders the accessibility theme metrics", () => {
    renderScreen();

    expect(screen.getByText("Fonte do tema: 18")).toBeOnTheScreen();
    expect(screen.getByText("Espaçamento: 16")).toBeOnTheScreen();
  });

  it("renders the main title only once", () => {
    renderScreen();

    expect(screen.getAllByText("SeniorEase Mobile")).toHaveLength(1);
  });

  it("renders metrics from the current provider theme", () => {
    function ThemeUpdater() {
      const { preferences, setPreferences } = useAccessibilityTheme();

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setPreferences({
              ...preferences,
              fontSize: "large",
              spacing: "wide",
            })
          }
        >
          <Text>Alterar tema técnico</Text>
        </Pressable>
      );
    }

    render(
      <AccessibilityThemeProvider>
        <ThemeUpdater />
        <TechnicalValidationScreen />
      </AccessibilityThemeProvider>,
    );

    fireEvent.press(
      screen.getByRole("button", { name: "Alterar tema técnico" }),
    );

    expect(screen.getByText("Fonte do tema: 22")).toBeOnTheScreen();
    expect(screen.getByText("Espaçamento: 20")).toBeOnTheScreen();
  });
});
