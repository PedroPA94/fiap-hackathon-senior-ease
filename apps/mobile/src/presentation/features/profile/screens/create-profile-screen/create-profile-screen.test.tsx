import type {
  Clock,
  IdGenerator,
} from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text } from "react-native";

import type { ApplicationSessionSnapshot } from "../../../../../application/session";
import {
  createApplicationContainer,
  type ApplicationContainer,
} from "../../../../../composition";
import { InMemoryStorage } from "../../../../../infrastructure/storage";
import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
  useApplicationSession,
} from "../../../../providers";
import { CreateProfileScreen } from "./create-profile-screen";

const now = "2026-07-24T12:00:00.000Z";

const onboardingSnapshot: ApplicationSessionSnapshot = {
  status: "onboardingRequired",
  users: [
    {
      id: "created-user",
      name: "Ana Maria",
      lastAccessedAt: now,
    },
  ],
  currentUser: {
    id: "created-user",
    name: "Ana Maria",
    createdAt: now,
    updatedAt: now,
  },
};

function SessionStatusProbe() {
  const session = useApplicationSession();

  return <Text testID="session-status">{session.status}</Text>;
}

function createTestContainer(): ApplicationContainer {
  const clock: Clock = {
    now: () => now,
    today: () => "2026-07-24",
  };
  const idGenerator: IdGenerator = {
    generate: () => "created-user",
  };

  return createApplicationContainer({
    storage: new InMemoryStorage(),
    clock,
    idGenerator,
  });
}

function renderScreen(container = createTestContainer()) {
  jest
    .spyOn(container.services.session, "bootstrap")
    .mockReturnValue(new Promise(() => undefined));

  render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <CreateProfileScreen />
          <SessionStatusProbe />
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );

  return { container };
}

describe("CreateProfileScreen", () => {
  it("renders the Figma hierarchy, field, and primary action", () => {
    renderScreen();

    expect(screen.getByText("SeniorEase")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "Vamos começar?" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Digite seu nome para personalizar sua experiência.",
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText("Seu nome, campo obrigatório"),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Continuar" }),
    ).toBeOnTheScreen();
  });

  it("blocks an empty name and presents a friendly validation error", () => {
    const { container } = renderScreen();
    const create = jest.spyOn(
      container.services.session,
      "createAndActivateProfile",
    );

    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));

    expect(create).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alert", {
        name: "Digite seu nome para continuar.",
      }),
    ).toBeOnTheScreen();
  });

  it("trims the name submitted by the button", async () => {
    const { container } = renderScreen();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const create = jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockReturnValue(deferred.promise);

    fireEvent.changeText(
      screen.getByLabelText("Seu nome, campo obrigatório"),
      "  Ana Maria  ",
    );
    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    await act(async () => {
      deferred.resolve(onboardingSnapshot);
      await deferred.promise;
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith("Ana Maria");
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "onboardingRequired",
      );
    });
  });

  it("submits with the done keyboard action", async () => {
    const { container } = renderScreen();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const create = jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockReturnValue(deferred.promise);
    const input = screen.getByLabelText("Seu nome, campo obrigatório");

    fireEvent.changeText(input, "Ana Maria");
    fireEvent(input, "submitEditing");
    await act(async () => {
      deferred.resolve(onboardingSnapshot);
      await deferred.promise;
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith("Ana Maria");
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "onboardingRequired",
      );
    });
    expect(input.props.returnKeyType).toBe("done");
    expect(input.props.maxLength).toBe(80);
  });

  it("uses the composed CreateUserProfileUseCase and activates the created profile", async () => {
    const { container } = renderScreen();
    const execute = jest.spyOn(
      container.useCases.userProfiles.create,
      "execute",
    );
    const create = jest.spyOn(
      container.services.session,
      "createAndActivateProfile",
    );

    fireEvent.changeText(
      screen.getByLabelText("Seu nome, campo obrigatório"),
      "Ana Maria",
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
      await create.mock.results[0].value;
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(execute).toHaveBeenCalledWith({
        id: "created-user",
        name: "Ana Maria",
      });
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "onboardingRequired",
      );
    });
    await expect(
      container.stores.session.getCurrentUserId(),
    ).resolves.toBe("created-user");
    await expect(
      container.repositories.userProfiles.findById("created-user"),
    ).resolves.toMatchObject({
      id: "created-user",
      name: "Ana Maria",
    });
  });

  it("shows loading and prevents concurrent submissions", async () => {
    const { container } = renderScreen();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const create = jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockReturnValue(deferred.promise);

    fireEvent.changeText(
      screen.getByLabelText("Seu nome, campo obrigatório"),
      "Ana Maria",
    );
    const button = screen.getByRole("button", { name: "Continuar" });

    fireEvent.press(button);
    fireEvent.press(button);

    expect(create).toHaveBeenCalledTimes(1);
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });

    await act(async () => {
      deferred.resolve(onboardingSnapshot);
      await deferred.promise;
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it("preserves the typed name and restores submit after an unexpected error", async () => {
    const { container } = renderScreen();

    const create = jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockRejectedValue(new Error("storage failed"));
    const input = screen.getByLabelText("Seu nome, campo obrigatório");

    fireEvent.changeText(input, "Ana Maria");
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
      await create.mock.results[0].value.catch(() => undefined);
    });

    expect(
      await screen.findByRole("alert", {
        name: "Erro: Não foi possível criar o perfil. Tente novamente.",
      }),
    ).toBeOnTheScreen();
    expect(input.props.value).toBe("Ana Maria");
    expect(
      screen.getByRole("button", { name: "Continuar" }).props
        .accessibilityState,
    ).toMatchObject({ busy: false, disabled: false });
  });

  it("clears the previous error and permits a new attempt", async () => {
    const { container } = renderScreen();
    const deferred = createDeferred<ApplicationSessionSnapshot>();
    const create = jest
      .spyOn(container.services.session, "createAndActivateProfile")
      .mockRejectedValueOnce(new Error("first failure"))
      .mockReturnValueOnce(deferred.promise);
    const input = screen.getByLabelText("Seu nome, campo obrigatório");

    fireEvent.changeText(input, "Ana Maria");
    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("alert");

    fireEvent.changeText(input, "Ana Maria Silva");

    expect(screen.queryByRole("alert")).not.toBeOnTheScreen();

    fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
    await act(async () => {
      deferred.resolve(onboardingSnapshot);
      await deferred.promise;
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(create).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("session-status")).toHaveTextContent(
        "onboardingRequired",
      );
    });
  });

  it("does not truncate headings or supporting copy", () => {
    renderScreen();

    const title = screen.getByText("Vamos começar?");
    const supportingCopy = screen.getByText(
      "Digite seu nome para personalizar sua experiência.",
    );

    expect(title.props.numberOfLines).toBeUndefined();
    expect(supportingCopy.props.numberOfLines).toBeUndefined();
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
