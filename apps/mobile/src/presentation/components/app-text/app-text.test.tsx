import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, StyleSheet, Text } from "react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { useAccessibilityTheme } from "../../providers";
import { AppText } from "./app-text";

function renderWithTheme(children: React.ReactNode) {
  return render(
    <AccessibilityThemeProvider>{children}</AccessibilityThemeProvider>,
  );
}

describe("AppText", () => {
  it("uses the body variant and current theme by default", () => {
    renderWithTheme(<AppText>Texto padrão</AppText>);

    const text = screen.getByText("Texto padrão");
    const style = StyleSheet.flatten(text.props.style);

    expect(style).toMatchObject({
      color: "#0F1A24",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 19,
    });
  });

  it("applies an explicit semantic variant", () => {
    renderWithTheme(<AppText variant="headingBold">Título explícito</AppText>);

    const style = StyleSheet.flatten(
      screen.getByText("Título explícito").props.style,
    );

    expect(style).toMatchObject({
      fontFamily: "Inter-SemiBold",
      fontSize: 32,
      fontWeight: "600",
      lineHeight: 38,
    });
  });

  it("updates when the accessibility preferences change", () => {
    function ThemeUpdater() {
      const { preferences, setPreferences } = useAccessibilityTheme();

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setPreferences({
              ...preferences,
              fontSize: "extra",
            })
          }
        >
          <Text>Ampliar fonte</Text>
        </Pressable>
      );
    }

    renderWithTheme(
      <>
        <ThemeUpdater />
        <AppText>Texto reativo</AppText>
      </>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Ampliar fonte" }));

    expect(
      StyleSheet.flatten(screen.getByText("Texto reativo").props.style),
    ).toMatchObject({
      fontSize: 24,
      lineHeight: 29,
    });
  });

  it("keeps font scaling enabled and does not truncate by default", () => {
    renderWithTheme(<AppText>Texto flexível</AppText>);

    const text = screen.getByText("Texto flexível");

    expect(text.props.allowFontScaling).toBe(true);
    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.ellipsizeMode).toBeUndefined();
  });

  it("accepts additional native text styles", () => {
    renderWithTheme(
      <AppText color="muted" style={{ textAlign: "center" }}>
        Texto customizado
      </AppText>,
    );

    expect(screen.getByText("Texto customizado")).toHaveStyle({
      color: "#5C6E80",
      textAlign: "center",
    });
  });
});
