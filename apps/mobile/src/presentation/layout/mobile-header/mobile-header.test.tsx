import type { UserProfile } from "@senior-ease/core";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import type { ApplicationSessionSnapshot } from "../../../application/session";
import { createApplicationContainer } from "../../../composition";
import { InMemoryStorage } from "../../../infrastructure/storage";
import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
} from "../../providers";
import { MobileHeader } from "./mobile-header";

const maria: UserProfile = {
  id: "user-1",
  name: "Maria Helena",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

const readySnapshot: ApplicationSessionSnapshot = {
  status: "ready",
  users: [
    {
      id: maria.id,
      name: maria.name,
      lastAccessedAt: "2026-07-24T12:00:00.000Z",
    },
  ],
  currentUser: maria,
};

const selectionSnapshot: ApplicationSessionSnapshot = {
  ...readySnapshot,
  status: "profileSelectionRequired",
  currentUser: null,
};

function renderHeader() {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });

  jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue(readySnapshot);

  render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <MobileHeader />
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );

  return { container };
}

describe("MobileHeader", () => {
  it("shows the brand, current user, and clears the profile on request", async () => {
    const { container } = renderHeader();
    const clear = jest
      .spyOn(container.services.session, "clearCurrentProfile")
      .mockResolvedValue(selectionSnapshot);

    expect(await screen.findByText("SeniorEase")).toBeOnTheScreen();
    expect(screen.getByText("Maria Helena")).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", {
        name: "Trocar perfil. Perfil atual: Maria Helena",
      }),
    );

    await waitFor(() => expect(clear).toHaveBeenCalledTimes(1));
  });
});
