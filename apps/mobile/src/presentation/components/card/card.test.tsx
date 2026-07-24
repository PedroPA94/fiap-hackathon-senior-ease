import { render, screen } from "@testing-library/react-native";

import { defaultColors } from "@senior-ease/tokens";

import { AccessibilityThemeProvider } from "../../providers";
import { AppText } from "../app-text/app-text";
import { Card } from "./card";

function renderCard(padding: "regular" | "compact" = "regular") {
  render(
    <AccessibilityThemeProvider>
      <Card padding={padding} testID="card">
        <AppText>Conteúdo do card</AppText>
      </Card>
    </AccessibilityThemeProvider>,
  );
}

describe("Card", () => {
  it("renders its content with themed surface and border", () => {
    renderCard();

    expect(screen.getByText("Conteúdo do card")).toBeOnTheScreen();
    expect(screen.getByTestId("card").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: defaultColors.background.surface,
          borderColor: defaultColors.border.default,
        }),
      ]),
    );
  });

  it("supports regular and compact padding", () => {
    renderCard("compact");

    expect(screen.getByTestId("card").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ padding: 12 }),
      ]),
    );
  });
});
