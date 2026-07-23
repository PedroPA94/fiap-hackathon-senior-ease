import { render, screen } from "@testing-library/react-native";

import { TechnicalValidationScreen } from "./technical-validation-screen";

describe("TechnicalValidationScreen", () => {
  it("renders the screen identity with an accessible heading", () => {
    render(<TechnicalValidationScreen />);

    expect(
      screen.getByRole("header", { name: "SeniorEase Mobile" }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Expo Router funcionando/)).toBeOnTheScreen();
  });

  it("renders values produced by the shared packages", () => {
    render(<TechnicalValidationScreen />);

    expect(screen.getByText(/Core carregado/)).toBeOnTheScreen();
    expect(screen.getByText(/Tokens carregados/)).toBeOnTheScreen();
    expect(screen.getByText("Validação Mobile")).toBeOnTheScreen();
  });

  it("renders the accessibility theme metrics", () => {
    render(<TechnicalValidationScreen />);

    expect(screen.getByText("Fonte do tema: 18")).toBeOnTheScreen();
    expect(screen.getByText("Espaçamento: 16")).toBeOnTheScreen();
  });

  it("renders the main title only once", () => {
    render(<TechnicalValidationScreen />);

    expect(screen.getAllByText("SeniorEase Mobile")).toHaveLength(1);
  });
});
