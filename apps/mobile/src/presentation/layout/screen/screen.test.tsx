import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { Screen, ScrollableScreen } from "./screen";

describe("Screen", () => {
  it("renders children with safe area, theme background, and padding", () => {
    render(
      <AccessibilityThemeProvider>
        <Screen style={{ opacity: 0.9 }} testID="screen">
          <Text>Conteúdo seguro</Text>
        </Screen>
      </AccessibilityThemeProvider>,
    );

    expect(screen.getByText("Conteúdo seguro")).toBeOnTheScreen();
    expect(screen.getByTestId("screen")).toHaveStyle({
      flex: 1,
      backgroundColor: "#F5FAFF",
      padding: 24,
      opacity: 0.9,
    });
  });

  it("allows removing the standard padding", () => {
    render(
      <AccessibilityThemeProvider>
        <Screen padded={false} testID="screen">
          <Text>Sem padding</Text>
        </Screen>
      </AccessibilityThemeProvider>,
    );

    expect(screen.getByTestId("screen")).not.toHaveStyle({
      padding: 24,
    });
  });
});

describe("ScrollableScreen", () => {
  it("keeps scroll indication and keyboard behavior native-friendly", () => {
    render(
      <AccessibilityThemeProvider>
        <ScrollableScreen testID="scrollable-screen">
          <Text>Conteúdo rolável</Text>
        </ScrollableScreen>
      </AccessibilityThemeProvider>,
    );

    const scrollView = screen.getByTestId("scrollable-screen");

    expect(screen.getByText("Conteúdo rolável")).toBeOnTheScreen();
    expect(scrollView.props.showsVerticalScrollIndicator).not.toBe(false);
    expect(scrollView.props.keyboardShouldPersistTaps).toBe("handled");
    expect(scrollView.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flexGrow: 1 }),
        expect.objectContaining({ padding: 24 }),
      ]),
    );
  });
});
