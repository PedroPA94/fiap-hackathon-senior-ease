import { render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { InlineFeedback, type InlineFeedbackVariant } from "./inline-feedback";

function renderFeedback(
  variant: InlineFeedbackVariant,
  message = "Mensagem contextual.",
) {
  return render(
    <AccessibilityThemeProvider>
      <InlineFeedback variant={variant}>{message}</InlineFeedback>
    </AccessibilityThemeProvider>,
  );
}

describe("InlineFeedback", () => {
  it.each<{
    variant: InlineFeedbackVariant;
    indicator: string;
    label: string;
  }>([
    { variant: "success", indicator: "✓", label: "Sucesso" },
    { variant: "error", indicator: "×", label: "Erro" },
    { variant: "info", indicator: "i", label: "Informação" },
    { variant: "warning", indicator: "!", label: "Atenção" },
  ])(
    "renders $variant with text and a non-color indicator",
    ({ indicator, label, variant }) => {
      renderFeedback(variant);

      expect(
        screen.getByText(indicator, {
          includeHiddenElements: true,
        }),
      ).toBeOnTheScreen();
      expect(screen.getByText("Mensagem contextual.")).toBeOnTheScreen();
      expect(
        screen.getByLabelText(`${label}: Mensagem contextual.`),
      ).toBeOnTheScreen();
    },
  );

  it("uses assertive alert semantics for errors", () => {
    renderFeedback("error");

    const feedback = screen.getByTestId("inline-feedback");

    expect(feedback.props.accessibilityRole).toBe("alert");
    expect(feedback.props.accessibilityLiveRegion).toBe("assertive");
  });

  it("uses a polite live region for non-error feedback", () => {
    renderFeedback("success");

    expect(screen.getByTestId("inline-feedback").props).toMatchObject({
      accessibilityLiveRegion: "polite",
    });
  });

  it("updates the announced text", () => {
    const rendered = renderFeedback("info", "Primeira mensagem.");

    rendered.rerender(
      <AccessibilityThemeProvider>
        <InlineFeedback variant="info">Segunda mensagem.</InlineFeedback>
      </AccessibilityThemeProvider>,
    );

    expect(screen.queryByText("Primeira mensagem.")).not.toBeOnTheScreen();
    expect(screen.getByText("Segunda mensagem.")).toBeOnTheScreen();
  });
});
