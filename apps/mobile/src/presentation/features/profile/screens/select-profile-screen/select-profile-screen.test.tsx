import type { UserProfile } from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text } from "react-native";

import type {
  ApplicationSessionSnapshot,
  LocalUserSummary,
} from "../../../../../application/session";
import { createApplicationContainer } from "../../../../../composition";
import { InMemoryStorage } from "../../../../../infrastructure/storage";
import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
  useApplicationSession,
} from "../../../../providers";
import { SelectProfileScreen } from "./select-profile-screen";

const users: readonly LocalUserSummary[] = [
  {
    id: "user-1",
    name: "Maria Helena",
    lastAccessedAt: "2026-07-24T12:00:00.000Z",
  },
  {
    id: "user-2",
    name: "José Carlos",
    lastAccessedAt: "2026-07-23T12:00:00.000Z",
  },
];

const selectedProfile: UserProfile = {
  id: users[1].id,
  name: users[1].name,
  createdAt: "2026-07-20T12:00:00.000Z",
  updatedAt: "2026-07-20T12:00:00.000Z",
};

const onboardingSnapshot: ApplicationSessionSnapshot = {
  status: "onboardingRequired",
  users,
  currentUser: selectedProfile,
};

function SessionStatusProbe() {
  const session = useApplicationSession();

  return <Text testID="session-status">{session.status}</Text>;
}

function renderScreen({
  localUsers = users,
  onCreateProfile = jest.fn(),
}: {
  localUsers?: readonly LocalUserSummary[];
  onCreateProfile?: jest.Mock;
} = {}) {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });

  jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue({
      status: "profileSelectionRequired",
      users: localUsers,
      currentUser: null,
    });

  render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <SelectProfileScreen onCreateProfile={onCreateProfile} />
          <SessionStatusProbe />
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );

  return { container, onCreateProfile };
}

describe("SelectProfileScreen", () => {
  it("renders the Figma hierarchy and every local profile", async () => {
    renderScreen();

    expect(await screen.findByText("SeniorEase")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Quem está usando?" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("Selecione seu perfil para continuar."),
    ).toBeOnTheScreen();
    expect(
      await screen.findByRole("radio", { name: users[0].name }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("radio", { name: users[1].name }),
    ).toBeOnTheScreen();
  });

  it("starts without selection and disables Continue", async () => {
    renderScreen();

    expect(
      (await screen.findByRole("button", { name: "Continuar" })).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.queryByTestId("selection-indicator"),
    ).not.toBeOnTheScreen();
  });

  it("selects visually without activating the session", async () => {
    const { container } = renderScreen();
    const selectProfile = jest.spyOn(
      container.services.session,
      "selectProfile",
    );

    fireEvent.press(
      await screen.findByRole("radio", { name: users[1].name }),
    );

    expect(selectProfile).not.toHaveBeenCalled();
    expect(
      screen.getByRole("radio", { name: users[1].name }).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId("selection-indicator", {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Continuar" }).props
        .accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it("confirms selection by identifier only after Continue", async () => {
    const { container } = renderScreen();
    const selectProfile = jest
      .spyOn(container.services.session, "selectProfile")
      .mockResolvedValue(onboardingSnapshot);

    fireEvent.press(
      await screen.findByRole("radio", { name: users[1].name }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(selectProfile).toHaveBeenCalledWith(users[1].id);
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "onboardingRequired",
      );
    });
  });

  it("keeps equal names as distinct choices identified by ID", async () => {
    const equalNameUsers = [
      users[0],
      {
        ...users[1],
        name: users[0].name,
      },
    ];
    const { container } = renderScreen({ localUsers: equalNameUsers });
    const selectProfile = jest
      .spyOn(container.services.session, "selectProfile")
      .mockResolvedValue({
        ...onboardingSnapshot,
        users: equalNameUsers,
      });

    const choices = await screen.findAllByRole("radio", {
      name: users[0].name,
    });

    fireEvent.press(choices[1]);
    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(selectProfile).toHaveBeenCalledWith(users[1].id);
    });
  });

  it("shows loading and blocks concurrent confirmation", async () => {
    const { container } = renderScreen();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const selectProfile = jest
      .spyOn(container.services.session, "selectProfile")
      .mockReturnValue(deferred.promise);

    fireEvent.press(
      await screen.findByRole("radio", { name: users[0].name }),
    );
    const button = screen.getByRole("button", { name: "Continuar" });

    fireEvent.press(button);
    fireEvent.press(button);

    expect(selectProfile).toHaveBeenCalledTimes(1);
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });

    await act(async () => {
      deferred.resolve({
        ...onboardingSnapshot,
        currentUser: {
          ...selectedProfile,
          id: users[0].id,
          name: users[0].name,
        },
      });
      await deferred.promise;
    });
  });

  it("shows a friendly error and allows another confirmation", async () => {
    const { container } = renderScreen();
    const selectProfile = jest
      .spyOn(container.services.session, "selectProfile")
      .mockRejectedValueOnce(new Error("missing profile"))
      .mockResolvedValueOnce(onboardingSnapshot);

    fireEvent.press(
      await screen.findByRole("radio", { name: users[1].name }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByRole("alert", {
        name: /não foi possível abrir este perfil/i,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(selectProfile).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
    });
  });

  it("requests the create-profile route through its public action", async () => {
    const onCreateProfile = jest.fn();

    renderScreen({ onCreateProfile });

    fireEvent.press(
      await screen.findByRole("button", { name: "Criar novo perfil" }),
    );

    expect(onCreateProfile).toHaveBeenCalledTimes(1);
  });

  it("allows long profile names to wrap", async () => {
    const longName =
      "Maria Helena da Silva Albuquerque de Souza e Oliveira";

    renderScreen({
      localUsers: [
        {
          ...users[0],
          name: longName,
        },
      ],
    });

    const name = await screen.findByText(longName);

    expect(name.props.numberOfLines).toBeUndefined();
    expect(name.props.ellipsizeMode).toBeUndefined();
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
