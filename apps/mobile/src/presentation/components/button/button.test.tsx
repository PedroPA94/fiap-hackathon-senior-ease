import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { Button } from "./button";

function renderButton(
  props: Partial<React.ComponentProps<typeof Button>> = {},
) {
  const onPress = jest.fn();

  render(
    <AccessibilityThemeProvider>
      <Button onPress={onPress} {...props}>
        {props.children ?? "Salvar"}
      </Button>
    </AccessibilityThemeProvider>,
  );

  return { onPress };
}

describe("Button", () => {
  it("renders an accessible label and handles press", () => {
    const { onPress } = renderButton();

    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("blocks press and exposes state when disabled", () => {
    const { onPress } = renderButton({ disabled: true });
    const button = screen.getByRole("button", { name: "Salvar" });

    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: false,
    });
  });

  it("renders loading and blocks press while busy", () => {
    const { onPress } = renderButton({
      accessibilityLabel: "Salvando",
      loading: true,
    });
    const button = screen.getByRole("button", { name: "Salvando" });

    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
    expect(
      screen.getByTestId("loading-indicator", {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  it("applies the requested visual variant", () => {
    renderButton({ variant: "danger" });

    expect(screen.getByRole("button", { name: "Salvar" })).toHaveStyle({
      backgroundColor: "#BF1414",
      borderColor: "#BF1414",
    });
  });

  it("keeps a minimum touch target and allows full-width opt out", () => {
    renderButton({ fullWidth: false });

    const button = screen.getByRole("button", { name: "Salvar" });

    expect(button).toHaveStyle({ minHeight: 48 });
    expect(button).not.toHaveStyle({ width: "100%" });
  });

  it("renders scalable label text", () => {
    renderButton({ accessibilityLabel: "Ação acessível" });

    expect(screen.getByText("Salvar").props.allowFontScaling).toBe(true);
  });
});
