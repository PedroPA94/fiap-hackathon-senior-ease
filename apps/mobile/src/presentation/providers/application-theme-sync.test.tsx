import type {
  AccessibilityPreferences,
  UserProfile,
} from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type { ApplicationSessionSnapshot } from "../../application/session";
import { createApplicationContainer } from "../../composition";
import { InMemoryStorage } from "../../infrastructure/storage";
import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
} from "./accessibility-theme-provider";
import { ApplicationContainerProvider } from "./application-container-provider";
import {
  ApplicationSessionProvider,
  useApplicationSession,
} from "./application-session-provider";
import { ApplicationThemeSync } from "./application-theme-sync";

const maria: UserProfile = {
  id: "user-1",
  name: "Maria",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

const jose: UserProfile = {
  ...maria,
  id: "user-2",
  name: "José",
};

function snapshotFor(
  currentUser: UserProfile,
): ApplicationSessionSnapshot {
  return {
    status: "ready",
    users: [
      {
        id: currentUser.id,
        name: currentUser.name,
        lastAccessedAt: "2026-07-24T12:00:00.000Z",
      },
    ],
    currentUser,
  };
}

const noCurrentUserSnapshot: ApplicationSessionSnapshot = {
  status: "profileSelectionRequired",
  users: [
    {
      id: maria.id,
      name: maria.name,
      lastAccessedAt: "2026-07-24T12:00:00.000Z",
    },
  ],
  currentUser: null,
};

const mariaPreferences: AccessibilityPreferences = {
  fontSize: "large",
  spacing: "wide",
  contrast: "default",
  interfaceMode: "basic",
  enhancedFeedback: true,
  confirmCriticalActions: true,
  remindersEnabled: false,
  reminderAdvance: "atTime",
};

const josePreferences: AccessibilityPreferences = {
  ...mariaPreferences,
  fontSize: "extra",
  contrast: "high",
};

function ThemeProbe() {
  const { preferences } = useAccessibilityTheme();

  return (
    <>
      <Text testID="synced-font-size">{preferences.fontSize}</Text>
      <Text testID="synced-contrast">{preferences.contrast}</Text>
    </>
  );
}

function SessionControls() {
  const session = useApplicationSession();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.selectProfile(jose.id)}
      >
        <Text>Selecionar José</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.clearCurrentProfile()}
      >
        <Text>Limpar usuário</Text>
      </Pressable>
    </>
  );
}

function renderSync(
  initialSnapshot: ApplicationSessionSnapshot,
  getPreferences: (
    userId: string,
  ) => Promise<AccessibilityPreferences> = () =>
    Promise.resolve(mariaPreferences),
) {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });

  jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue(initialSnapshot);
  const get = jest
    .spyOn(container.useCases.accessibilityPreferences.get, "execute")
    .mockImplementation(({ userId }) => getPreferences(userId));

  render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <SessionControls />
          <ApplicationThemeSync>
            <ThemeProbe />
          </ApplicationThemeSync>
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );

  return { container, get };
}

describe("ApplicationThemeSync", () => {
  it("loads and applies preferences for the current user", async () => {
    const { get } = renderSync(snapshotFor(maria));

    await waitFor(() => {
      expect(screen.getByTestId("synced-font-size")).toHaveTextContent(
        "large",
      );
    });
    expect(get).toHaveBeenCalledWith({ userId: maria.id });
  });

  it("applies the new user's preferences after a profile switch", async () => {
    const { container } = renderSync(
      snapshotFor(maria),
      (userId) =>
        Promise.resolve(
          userId === jose.id ? josePreferences : mariaPreferences,
        ),
    );
    jest
      .spyOn(container.services.session, "selectProfile")
      .mockResolvedValue(snapshotFor(jose));
    await screen.findByTestId("synced-font-size");

    fireEvent.press(
      screen.getByRole("button", { name: "Selecionar José" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("synced-font-size")).toHaveTextContent(
        "extra",
      );
      expect(screen.getByTestId("synced-contrast")).toHaveTextContent(
        "high",
      );
    });
  });

  it("resets to defaults when there is no current user", async () => {
    const { container } = renderSync(snapshotFor(maria));
    jest
      .spyOn(container.services.session, "clearCurrentProfile")
      .mockResolvedValue(noCurrentUserSnapshot);
    await waitFor(() => {
      expect(screen.getByTestId("synced-font-size")).toHaveTextContent(
        "large",
      );
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Limpar usuário" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("synced-font-size")).toHaveTextContent(
        "normal",
      );
      expect(screen.getByTestId("synced-contrast")).toHaveTextContent(
        "default",
      );
    });
  });

  it("ignores an older response after the current user changes", async () => {
    const mariaRequest = createDeferred<AccessibilityPreferences>();
    const { container } = renderSync(
      snapshotFor(maria),
      (userId) =>
        userId === maria.id
          ? mariaRequest.promise
          : Promise.resolve(josePreferences),
    );
    jest
      .spyOn(container.services.session, "selectProfile")
      .mockResolvedValue(snapshotFor(jose));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Selecionar José" }),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByRole("button", { name: "Selecionar José" }),
    );
    await waitFor(() => {
      expect(screen.getByTestId("synced-font-size")).toHaveTextContent(
        "extra",
      );
    });

    await act(async () => {
      mariaRequest.resolve(mariaPreferences);
      await mariaRequest.promise;
    });

    expect(screen.getByTestId("synced-font-size")).toHaveTextContent("extra");
  });
});

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}
