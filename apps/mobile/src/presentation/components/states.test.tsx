import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../providers";
import { EmptyState } from "./empty-state/empty-state";
import { ErrorState } from "./error-state/error-state";

describe("presentation states", () => {
  it("renders an EmptyState with its optional action", () => {
    const onAction = jest.fn();

    render(
      <AccessibilityThemeProvider>
        <EmptyState
          actionLabel="Ver atividades"
          description="Não há itens por aqui."
          onAction={onAction}
          title="Tudo pronto"
        />
      </AccessibilityThemeProvider>,
    );

    expect(screen.getByRole("header", { name: "Tudo pronto" })).toBeOnTheScreen();
    expect(screen.getByText("Não há itens por aqui.")).toBeOnTheScreen();
    fireEvent.press(screen.getByRole("button", { name: "Ver atividades" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders an ErrorState and retries", () => {
    const onRetry = jest.fn();

    render(
      <AccessibilityThemeProvider>
        <ErrorState message="Não foi possível carregar." onRetry={onRetry} />
      </AccessibilityThemeProvider>,
    );

    expect(screen.getByRole("alert")).toBeOnTheScreen();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
