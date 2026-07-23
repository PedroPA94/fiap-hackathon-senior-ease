import {
  render,
  screen as testingLibraryScreen,
} from "@testing-library/react-native";
import {
  renderRouter,
  screen as routerScreen,
} from "expo-router/testing-library";

import IndexRoute from "../../app/index";
import { TechnicalValidationScreen } from "../../src/presentation/screens/technical-validation/technical-validation-screen";

describe("index route", () => {
  it("renders the technical screen from the real index route", () => {
    render(<IndexRoute />);

    expect(
      testingLibraryScreen.getByRole("header", { name: "SeniorEase Mobile" }),
    ).toBeOnTheScreen();
  });

  it("renders the initial route in an in-memory router", () => {
    renderRouter(
      {
        index: TechnicalValidationScreen,
      },
      {
        initialUrl: "/",
      },
    );

    expect(routerScreen).toHavePathname("/");
    expect(
      routerScreen.getByRole("header", { name: "SeniorEase Mobile" }),
    ).toBeOnTheScreen();
  });
});
