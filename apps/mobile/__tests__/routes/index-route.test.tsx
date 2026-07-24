import {
  render,
  screen as testingLibraryScreen,
} from "@testing-library/react-native";
import { useFonts } from "expo-font";
import { Text } from "react-native";
import {
  renderRouter,
  screen as routerScreen,
} from "expo-router/testing-library";

import RootLayout from "../../app/_layout";
import IndexRoute from "../../app/index";
import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
  useApplicationContainer,
} from "../../src/presentation/providers";

function ProviderProbe() {
  const container = useApplicationContainer();
  const { theme } = useAccessibilityTheme();

  return (
    <Text>
      {container.repositories.userProfiles && theme.mode === "basic"
        ? "Providers disponíveis"
        : "Providers indisponíveis"}
    </Text>
  );
}

describe("index route", () => {
  const mockedUseFonts = jest.mocked(useFonts);

  beforeEach(() => {
    mockedUseFonts.mockReturnValue([true, null]);
  });

  it("renders the technical screen from the real index route", () => {
    render(
      <AccessibilityThemeProvider>
        <IndexRoute />
      </AccessibilityThemeProvider>,
    );

    expect(
      testingLibraryScreen.getByRole("header", { name: "SeniorEase Mobile" }),
    ).toBeOnTheScreen();
  });

  it("renders the initial route in an in-memory router", () => {
    renderRouter(
      {
        _layout: RootLayout,
        index: IndexRoute,
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

  it("provides the application container and accessibility theme at the root", () => {
    renderRouter(
      {
        _layout: RootLayout,
        index: ProviderProbe,
      },
      {
        initialUrl: "/",
      },
    );

    expect(routerScreen.getByText("Providers disponíveis")).toBeOnTheScreen();
  });

  it("renders the loading screen before the Inter font is ready", () => {
    mockedUseFonts.mockReturnValue([false, null]);

    renderRouter(
      {
        _layout: RootLayout,
        index: IndexRoute,
      },
      {
        initialUrl: "/",
      },
    );

    expect(
      routerScreen.getByRole("progressbar", {
        name: "Preparando tudo para você...",
      }),
    ).toBeOnTheScreen();
    expect(
      routerScreen.queryByRole("header", { name: "SeniorEase Mobile" }),
    ).not.toBeOnTheScreen();
  });
});
