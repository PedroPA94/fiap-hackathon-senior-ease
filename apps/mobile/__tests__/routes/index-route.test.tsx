import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "@senior-ease/core";
import {
  fireEvent,
  render,
  screen as testingLibraryScreen,
  waitFor,
} from "@testing-library/react-native";
import { useFonts } from "expo-font";
import { Text } from "react-native";
import {
  renderRouter,
  screen as routerScreen,
} from "expo-router/testing-library";

import RootLayout from "../../app/_layout";
import IndexRoute from "../../app/index";
import type { ApplicationSessionSnapshot } from "../../src/application/session";
import { createApplicationContainer } from "../../src/composition";
import { InMemoryStorage } from "../../src/infrastructure/storage";
import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../src/presentation/providers";

const maria: UserProfile = {
  id: "user-1",
  name: "Maria",
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const localMaria = {
  id: maria.id,
  name: maria.name,
  lastAccessedAt: "2026-07-24T12:00:00.000Z",
};

function ProviderProbe() {
  const container = useApplicationContainer();
  const { theme } = useAccessibilityTheme();
  const session = useApplicationSession();

  return (
    <Text>
      {container.services.session &&
      theme.mode === "basic" &&
      session.status
        ? "Providers disponíveis"
        : "Providers indisponíveis"}
    </Text>
  );
}

function renderIndex(snapshot: ApplicationSessionSnapshot) {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });

  jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue(snapshot);

  return render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <IndexRoute />
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );
}

describe("index route", () => {
  const mockedUseFonts = jest.mocked(useFonts);

  beforeEach(async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    await AsyncStorage.clear();
  });

  it("uses LoadingScreen while the session bootstrap is pending", () => {
    const container = createApplicationContainer({
      storage: new InMemoryStorage(),
    });

    jest
      .spyOn(container.services.session, "bootstrap")
      .mockReturnValue(new Promise(() => undefined));

    render(
      <ApplicationContainerProvider container={container}>
        <AccessibilityThemeProvider>
          <ApplicationSessionProvider>
            <IndexRoute />
          </ApplicationSessionProvider>
        </AccessibilityThemeProvider>
      </ApplicationContainerProvider>,
    );

    expect(
      testingLibraryScreen.getByRole("progressbar", {
        name: "Preparando tudo para você...",
      }),
    ).toBeOnTheScreen();
  });

  it("shows a recoverable error and retries bootstrap", async () => {
    const container = createApplicationContainer({
      storage: new InMemoryStorage(),
    });
    const bootstrap = jest
      .spyOn(container.services.session, "bootstrap")
      .mockRejectedValueOnce(new Error("storage failure"))
      .mockResolvedValueOnce({
        status: "noProfiles",
        users: [],
        currentUser: null,
      });

    render(
      <ApplicationContainerProvider container={container}>
        <AccessibilityThemeProvider>
          <ApplicationSessionProvider>
            <IndexRoute />
          </ApplicationSessionProvider>
        </AccessibilityThemeProvider>
      </ApplicationContainerProvider>,
    );

    expect(
      await testingLibraryScreen.findByRole("alert", {
        name: /não foi possível ler os dados locais/i,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(
      testingLibraryScreen.getByRole("button", {
        name: "Tentar novamente",
      }),
    );

    expect(
      await testingLibraryScreen.findByRole("header", {
        name: "Nenhum perfil local",
      }),
    ).toBeOnTheScreen();
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it("shows the provisional no-profile destination", async () => {
    renderIndex({
      status: "noProfiles",
      users: [],
      currentUser: null,
    });

    expect(
      await testingLibraryScreen.findByRole("header", {
        name: "Nenhum perfil local",
      }),
    ).toBeOnTheScreen();
  });

  it("shows how many profiles await selection", async () => {
    renderIndex({
      status: "profileSelectionRequired",
      users: [
        localMaria,
        {
          ...localMaria,
          id: "user-2",
          name: "José",
        },
      ],
      currentUser: null,
    });

    expect(
      await testingLibraryScreen.findByText(
        "2 perfis locais aguardando seleção.",
      ),
    ).toBeOnTheScreen();
  });

  it("shows the current user when onboarding is required", async () => {
    renderIndex({
      status: "onboardingRequired",
      users: [localMaria],
      currentUser: maria,
    });

    expect(
      await testingLibraryScreen.findByText(
        "Onboarding pendente para Maria.",
      ),
    ).toBeOnTheScreen();
  });

  it("renders the technical screen when the session is ready", async () => {
    renderIndex({
      status: "ready",
      users: [localMaria],
      currentUser: maria,
    });

    expect(
      await testingLibraryScreen.findByRole("header", {
        name: "SeniorEase Mobile",
      }),
    ).toBeOnTheScreen();
  });

  it("keeps container, theme, and session providers integrated at the root", async () => {
    renderRouter(
      {
        _layout: RootLayout,
        index: ProviderProbe,
      },
      {
        initialUrl: "/",
      },
    );

    expect(routerScreen).toHavePathname("/");
    await waitFor(() => {
      expect(
        routerScreen.getByText("Providers disponíveis"),
      ).toBeOnTheScreen();
    });
  });

  it("renders font loading before mounting the session provider", () => {
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
      routerScreen.queryByRole("header", {
        name: "Nenhum perfil local",
      }),
    ).not.toBeOnTheScreen();
  });
});
