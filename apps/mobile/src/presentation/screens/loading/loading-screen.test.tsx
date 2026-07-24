import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
} from "../../providers";
import { LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  it("renders the brand, message, and activity indicator", () => {
    render(
      <AccessibilityThemeProvider>
        <LoadingScreen />
      </AccessibilityThemeProvider>,
    );

    expect(screen.getByText("SeniorEase")).toBeOnTheScreen();
    expect(screen.getByText("Preparando tudo para você...")).toBeOnTheScreen();
    expect(
      screen.getByTestId("loading-indicator", {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  it("exposes a polite progress region", () => {
    render(
      <AccessibilityThemeProvider>
        <LoadingScreen />
      </AccessibilityThemeProvider>,
    );

    const progress = screen.getByRole("progressbar", {
      name: "Preparando tudo para você...",
    });

    expect(progress.props.accessibilityLiveRegion).toBe("polite");
    expect(progress.props.accessibilityValue).toEqual({
      text: "Preparando tudo para você...",
    });
  });

  it("updates its indicator for the high-contrast theme", () => {
    function ContrastUpdater() {
      const { preferences, setPreferences } = useAccessibilityTheme();

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setPreferences({
              ...preferences,
              contrast: "high",
            })
          }
        >
          <Text>Ativar alto contraste</Text>
        </Pressable>
      );
    }

    render(
      <AccessibilityThemeProvider>
        <ContrastUpdater />
        <LoadingScreen />
      </AccessibilityThemeProvider>,
    );

    fireEvent.press(
      screen.getByRole("button", { name: "Ativar alto contraste" }),
    );

    expect(
      screen.getByTestId("loading-indicator", {
        includeHiddenElements: true,
      }).props.color,
    ).toBe("#083E49");
  });
});
