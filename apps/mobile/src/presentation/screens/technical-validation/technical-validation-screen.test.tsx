import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../providers";
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
    expect(screen.getByText(/Primitives carregados/)).toBeOnTheScreen();
    expect(screen.getByText("Validação Mobile")).toBeOnTheScreen();
  });

  it("demonstrates the visual primitives without becoming a catalog", () => {
    renderScreen();

    expect(
      screen.getByLabelText("Sucesso: Runtime visual acessível carregado."),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Campo técnico")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Alternar tema ampliado" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Restaurar tema padrão" }),
    ).toBeOnTheScreen();
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

  it("updates and restores the in-memory theme", () => {
    renderScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Alternar tema ampliado" }),
    );

    expect(screen.getByText("Fonte do tema: 26")).toBeOnTheScreen();
    expect(screen.getByText("Espaçamento: 24")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Restaurar tema padrão" }),
    );

    expect(screen.getByText("Fonte do tema: 18")).toBeOnTheScreen();
    expect(screen.getByText("Espaçamento: 16")).toBeOnTheScreen();
  });
});
