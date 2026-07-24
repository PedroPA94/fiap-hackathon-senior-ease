import type {
  EntityId,
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
import {
  createApplicationContainer,
  type ApplicationContainer,
} from "../../composition";
import { InMemoryStorage } from "../../infrastructure/storage";
import { ApplicationContainerProvider } from "./application-container-provider";
import {
  ApplicationSessionProvider,
  useApplicationSession,
  type ApplicationSessionContextValue,
} from "./application-session-provider";

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

function SessionProbe({
  onValue,
}: {
  onValue?: (value: ApplicationSessionContextValue) => void;
}) {
  const session = useApplicationSession();

  onValue?.(session);

  return (
    <>
      <Text testID="status">{session.status}</Text>
      <Text testID="users">{session.users.length}</Text>
      <Text testID="current-user">{session.currentUser?.name ?? "none"}</Text>
      <Text testID="error">{session.error?.message ?? "none"}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.retry()}
      >
        <Text>Retry</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.selectProfile(maria.id)}
      >
        <Text>Select</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.clearCurrentProfile()}
      >
        <Text>Clear</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.registerProfile(maria)}
      >
        <Text>Register</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void session.completeOnboarding()}
      >
        <Text>Complete</Text>
      </Pressable>
    </>
  );
}

function createTestContainer(): ApplicationContainer {
  return createApplicationContainer({
    storage: new InMemoryStorage(),
  });
}

function renderProvider(
  container: ApplicationContainer,
  onValue?: (value: ApplicationSessionContextValue) => void,
) {
  return render(
    <ApplicationContainerProvider container={container}>
      <ApplicationSessionProvider>
        <SessionProbe onValue={onValue} />
      </ApplicationSessionProvider>
    </ApplicationContainerProvider>,
  );
}

describe("ApplicationSessionProvider", () => {
  it("starts in loading and executes bootstrap", () => {
    const container = createTestContainer();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const bootstrap = jest
      .spyOn(container.services.session, "bootstrap")
      .mockReturnValue(deferred.promise);

    renderProvider(container);

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["noProfiles", snapshots.noProfiles, "0", "none"],
    [
      "profileSelectionRequired",
      snapshots.profileSelectionRequired,
      "1",
      "none",
    ],
    [
      "onboardingRequired",
      snapshots.onboardingRequired,
      "1",
      maria.name,
    ],
    ["ready", snapshots.ready, "1", maria.name],
  ])(
    "exposes %s returned by bootstrap",
    async (status, snapshot, users, currentUser) => {
      const container = createTestContainer();

      jest
        .spyOn(container.services.session, "bootstrap")
        .mockResolvedValue(snapshot);

      renderProvider(container);

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(status);
      });
      expect(screen.getByTestId("users")).toHaveTextContent(users);
      expect(screen.getByTestId("current-user")).toHaveTextContent(
        currentUser,
      );
    },
  );

  it("exposes the original bootstrap error", async () => {
    const container = createTestContainer();
    const error = new Error("repository failed");

    jest
      .spyOn(container.services.session, "bootstrap")
      .mockRejectedValue(error);

    renderProvider(container);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
    expect(screen.getByTestId("error")).toHaveTextContent(error.message);
  });

  it("retries bootstrap after an error", async () => {
    const container = createTestContainer();
    const bootstrap = jest
      .spyOn(container.services.session, "bootstrap")
      .mockRejectedValueOnce(new Error("first failure"))
      .mockResolvedValueOnce(snapshots.noProfiles);

    renderProvider(container);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });

    fireEvent.press(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("noProfiles");
    });
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["Select", "selectProfile", snapshots.onboardingRequired],
    ["Clear", "clearCurrentProfile", snapshots.profileSelectionRequired],
    ["Register", "registerProfile", snapshots.onboardingRequired],
    ["Complete", "completeOnboarding", snapshots.ready],
  ] as const)(
    "%s updates the context with the service result",
    async (buttonName, method, snapshot) => {
      const container = createTestContainer();

      jest
        .spyOn(container.services.session, "bootstrap")
        .mockResolvedValue(snapshots.noProfiles);
      const action = jest
        .spyOn(container.services.session, method)
        .mockResolvedValue(snapshot);

      renderProvider(container);
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("noProfiles");
      });

      fireEvent.press(
        screen.getByRole("button", {
          name: buttonName,
        }),
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent(
          snapshot.status,
        );
      });
      expect(action).toHaveBeenCalledTimes(1);

      if (method === "selectProfile") {
        expect(action).toHaveBeenCalledWith(maria.id);
      }

      if (method === "registerProfile") {
        expect(action).toHaveBeenCalledWith(maria);
      }
    },
  );

  it("ignores an older async result after a newer retry", async () => {
    const container = createTestContainer();
    const firstRetry = createDeferred<ApplicationSessionSnapshot>();
    const secondRetry = createDeferred<ApplicationSessionSnapshot>();

    jest
      .spyOn(container.services.session, "bootstrap")
      .mockResolvedValueOnce(snapshots.noProfiles)
      .mockReturnValueOnce(firstRetry.promise)
      .mockReturnValueOnce(secondRetry.promise);

    renderProvider(container);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("noProfiles");
    });

    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));

    await act(async () => {
      secondRetry.resolve(snapshots.ready);
      await secondRetry.promise;
    });
    expect(screen.getByTestId("status")).toHaveTextContent("ready");

    await act(async () => {
      firstRetry.resolve(snapshots.profileSelectionRequired);
      await firstRetry.promise;
    });
    expect(screen.getByTestId("status")).toHaveTextContent("ready");
  });

  it("ignores bootstrap resolution after unmount", async () => {
    const container = createTestContainer();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const onValue = jest.fn();

    jest
      .spyOn(container.services.session, "bootstrap")
      .mockReturnValue(deferred.promise);

    const rendered = renderProvider(container, onValue);
    rendered.unmount();
    const renderCountAfterUnmount = onValue.mock.calls.length;

    await act(async () => {
      deferred.resolve(snapshots.ready);
      await deferred.promise;
    });

    expect(onValue).toHaveBeenCalledTimes(renderCountAfterUnmount);
  });

  it("throws a clear error when the hook is outside its provider", () => {
    expect(() => render(<SessionProbe />)).toThrow(
      "useApplicationSession must be used within an ApplicationSessionProvider.",
    );
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
