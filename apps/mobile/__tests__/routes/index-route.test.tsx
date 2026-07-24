import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "@senior-ease/core";
import {
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import {
  renderRouter,
  screen as routerScreen,
} from "expo-router/testing-library";
import { Text } from "react-native";

import RootLayout from "../../app/_layout";
import OnboardingLayout from "../../app/(onboarding)/_layout";
import CreateProfileRoute from "../../app/(onboarding)/create-profile";
import PersonalizationSetupRoute from "../../app/(onboarding)/personalization-setup";
import SelectProfileRoute from "../../app/(onboarding)/select-profile";
import TabsLayout from "../../app/(tabs)/_layout";
import ActivitiesRoute from "../../app/(tabs)/activities";
import HomeRoute from "../../app/(tabs)/home";
import PersonalizationRoute from "../../app/(tabs)/personalization";
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

const snapshots = {
  noProfiles: {
    status: "noProfiles",
    users: [],
    currentUser: null,
  },
  profileSelectionRequired: {
    status: "profileSelectionRequired",
    users: [localMaria],
    currentUser: null,
  },
  onboardingRequired: {
    status: "onboardingRequired",
    users: [localMaria],
    currentUser: maria,
  },
  ready: {
    status: "ready",
    users: [localMaria],
    currentUser: maria,
  },
} satisfies Record<string, ApplicationSessionSnapshot>;

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

function renderSessionRouter(
  snapshot: ApplicationSessionSnapshot,
  initialUrl = "/",
) {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });
  const bootstrap = jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue(snapshot);

  function TestLayout() {
    return (
      <ApplicationContainerProvider container={container}>
        <AccessibilityThemeProvider>
          <ApplicationSessionProvider>
            <Slot />
          </ApplicationSessionProvider>
        </AccessibilityThemeProvider>
      </ApplicationContainerProvider>
    );
  }

  renderRouter(
    {
      _layout: TestLayout,
      index: IndexRoute,
      "(onboarding)/_layout": OnboardingLayout,
      "(onboarding)/create-profile": CreateProfileRoute,
      "(onboarding)/personalization-setup": PersonalizationSetupRoute,
      "(onboarding)/select-profile": SelectProfileRoute,
      "(tabs)/_layout": TabsLayout,
      "(tabs)/activities": ActivitiesRoute,
      "(tabs)/home": HomeRoute,
      "(tabs)/personalization": PersonalizationRoute,
    },
    { initialUrl },
  );

  return { bootstrap, container };
}

describe("profile bootstrap routes", () => {
  const mockedUseFonts = jest.mocked(useFonts);

  beforeEach(async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    await AsyncStorage.clear();
  });

  it("redirects noProfiles to the real create-profile route without loops", async () => {
    const { bootstrap } = renderSessionRouter(snapshots.noProfiles);

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });
    expect(
      routerScreen.getByRole("header", { name: "Vamos começar?" }),
    ).toBeOnTheScreen();
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  it("redirects profileSelectionRequired to the real selection route", async () => {
    renderSessionRouter(snapshots.profileSelectionRequired);

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/select-profile");
    });
    expect(
      routerScreen.getByRole("header", { name: "Quem está usando?" }),
    ).toBeOnTheScreen();
  });

  it("redirects onboardingRequired to the real personalization setup", async () => {
    renderSessionRouter(snapshots.onboardingRequired);

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/personalization-setup");
    });
    expect(
      await routerScreen.findByRole("header", {
        name: "Vamos deixar a tela mais confortável para você",
      }),
    ).toBeOnTheScreen();
  });

  it("redirects ready to the Home tab without the technical screen", async () => {
    renderSessionRouter(snapshots.ready);

    expect(
      await routerScreen.findByRole("header", {
        name: "Olá, Maria!",
      }),
    ).toBeOnTheScreen();
    expect(routerScreen).toHavePathname("/home");
    expect(
      routerScreen.queryByRole("header", {
        name: "SeniorEase Mobile",
      }),
    ).not.toBeOnTheScreen();
  });

  it("uses LoadingScreen while bootstrap is pending", () => {
    const container = createApplicationContainer({
      storage: new InMemoryStorage(),
    });

    jest
      .spyOn(container.services.session, "bootstrap")
      .mockReturnValue(new Promise(() => undefined));

    function LoadingLayout() {
      return (
        <ApplicationContainerProvider container={container}>
          <AccessibilityThemeProvider>
            <ApplicationSessionProvider>
              <Slot />
            </ApplicationSessionProvider>
          </AccessibilityThemeProvider>
        </ApplicationContainerProvider>
      );
    }

    renderRouter(
      {
        _layout: LoadingLayout,
        index: IndexRoute,
      },
      { initialUrl: "/" },
    );

    expect(
      routerScreen.getByRole("progressbar", {
        name: "Preparando tudo para você...",
      }),
    ).toBeOnTheScreen();
  });

  it("keeps bootstrap errors recoverable and retries into creation", async () => {
    const container = createApplicationContainer({
      storage: new InMemoryStorage(),
    });
    const bootstrap = jest
      .spyOn(container.services.session, "bootstrap")
      .mockRejectedValueOnce(new Error("storage failure"))
      .mockResolvedValueOnce(snapshots.noProfiles);

    function ErrorLayout() {
      return (
        <ApplicationContainerProvider container={container}>
          <AccessibilityThemeProvider>
            <ApplicationSessionProvider>
              <Slot />
            </ApplicationSessionProvider>
          </AccessibilityThemeProvider>
        </ApplicationContainerProvider>
      );
    }

    renderRouter(
      {
        _layout: ErrorLayout,
        index: IndexRoute,
        "(onboarding)/_layout": OnboardingLayout,
        "(onboarding)/create-profile": CreateProfileRoute,
      },
      { initialUrl: "/" },
    );

    expect(
      await routerScreen.findByRole("alert", {
        name: /não foi possível ler os dados locais/i,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(
      routerScreen.getByRole("button", {
        name: "Tentar novamente",
      }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it("redirects an unexpectedly empty selection route to creation", async () => {
    renderSessionRouter(snapshots.noProfiles, "/select-profile");

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });
  });

  it("follows the session state after profile creation", async () => {
    const { container } = renderSessionRouter(snapshots.noProfiles);

    jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockResolvedValue(snapshots.onboardingRequired);
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });

    fireEvent.changeText(
      routerScreen.getByLabelText("Seu nome, campo obrigatório"),
      "Maria",
    );
    fireEvent.press(
      routerScreen.getByRole("button", { name: "Continuar" }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/personalization-setup");
      expect(
        routerScreen.getByRole("header", {
          name: "Vamos deixar a tela mais confortável para você",
        }),
      ).toBeOnTheScreen();
    });
  });

  it("follows the session state only after selection confirmation", async () => {
    const { container } = renderSessionRouter(
      snapshots.profileSelectionRequired,
    );

    jest
      .spyOn(container.services.session, "selectProfile")
      .mockResolvedValue(snapshots.onboardingRequired);
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/select-profile");
    });

    fireEvent.press(
      routerScreen.getByRole("radio", { name: localMaria.name }),
    );
    expect(routerScreen).toHavePathname("/select-profile");

    fireEvent.press(
      routerScreen.getByRole("button", { name: "Continuar" }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/personalization-setup");
      expect(
        routerScreen.getByRole("header", {
          name: "Vamos deixar a tela mais confortável para você",
        }),
      ).toBeOnTheScreen();
    });
  });

  it("alternates explicitly between profile selection and creation", async () => {
    renderSessionRouter(snapshots.profileSelectionRequired);
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/select-profile");
    });

    fireEvent.press(
      routerScreen.getByRole("button", {
        name: "Criar novo perfil",
      }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });

    fireEvent.press(
      routerScreen.getByRole("button", {
        name: "Selecionar perfil existente",
      }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/select-profile");
    });
  });

  it("protects setup when the session requires profile creation", async () => {
    renderSessionRouter(snapshots.noProfiles, "/personalization-setup");

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/create-profile");
    });
  });

  it("returns a ready session from setup to Home", async () => {
    const { container } = renderSessionRouter(
      snapshots.onboardingRequired,
      "/personalization-setup",
    );
    jest
      .spyOn(container.services.session, "completeOnboarding")
      .mockResolvedValue(snapshots.ready);
    await routerScreen.findByRole("button", { name: "Começar" });

    fireEvent.press(
      routerScreen.getByRole("button", { name: "Começar" }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/home");
      expect(
        routerScreen.getByRole("header", {
          name: "Olá, Maria!",
        }),
      ).toBeOnTheScreen();
    });
  });

  it("navigates predictably between the three main tabs", async () => {
    renderSessionRouter(snapshots.ready);
    await routerScreen.findByRole("header", { name: "Olá, Maria!" });

    fireEvent.press(
      routerScreen.getByLabelText("Aba Personalização"),
    );
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/personalization");
      expect(
        routerScreen.getByRole("header", { name: "Personalização" }),
      ).toBeOnTheScreen();
    });

    fireEvent.press(routerScreen.getByLabelText("Aba Atividades"));
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/activities");
      expect(
        routerScreen.getByRole("header", { name: "Atividades" }),
      ).toBeOnTheScreen();
    });

    fireEvent.press(routerScreen.getByLabelText("Aba Início"));
    await waitFor(() => {
      expect(routerScreen).toHavePathname("/home");
      expect(
        routerScreen.getByRole("header", { name: "Olá, Maria!" }),
      ).toBeOnTheScreen();
    });
  });

  it("returns profile switching from tabs to the selection flow", async () => {
    const { container } = renderSessionRouter(snapshots.ready);
    jest
      .spyOn(container.services.session, "clearCurrentProfile")
      .mockResolvedValue(snapshots.profileSelectionRequired);
    await routerScreen.findByRole("header", { name: "Olá, Maria!" });

    fireEvent.press(
      routerScreen.getByRole("button", {
        name: "Trocar perfil. Perfil atual: Maria",
      }),
    );

    await waitFor(() => {
      expect(routerScreen).toHavePathname("/select-profile");
      expect(
        routerScreen.getByRole("header", { name: "Quem está usando?" }),
      ).toBeOnTheScreen();
    });
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
    expect(
      await routerScreen.findByText("Providers disponíveis"),
    ).toBeOnTheScreen();
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
  });
});
