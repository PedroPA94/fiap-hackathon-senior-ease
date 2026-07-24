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
  within,
} from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { useState } from "react";

import type { ApplicationSessionSnapshot } from "../../../../../application/session";
import { createApplicationContainer } from "../../../../../composition";
import { InMemoryStorage } from "../../../../../infrastructure/storage";
import {
  AccessibilityThemeProvider,
  ApplicationContainerProvider,
  ApplicationSessionProvider,
  useAccessibilityTheme,
} from "../../../../providers";
import { PersonalizationSetupScreen } from "./personalization-setup-screen";

const maria: UserProfile = {
  id: "user-1",
  name: "Maria",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

const onboardingSnapshot: ApplicationSessionSnapshot = {
  status: "onboardingRequired",
  users: [
    {
      id: maria.id,
      name: maria.name,
      lastAccessedAt: "2026-07-24T12:00:00.000Z",
    },
  ],
  currentUser: maria,
};

const readySnapshot: ApplicationSessionSnapshot = {
  ...onboardingSnapshot,
  status: "ready",
};

const loadedPreferences: AccessibilityPreferences = {
  fontSize: "large",
  spacing: "wide",
  contrast: "default",
  interfaceMode: "basic",
  enhancedFeedback: false,
  confirmCriticalActions: false,
  remindersEnabled: true,
  reminderAdvance: "oneDay",
};

function ThemeProbe() {
  const { preferences } = useAccessibilityTheme();

  return <Text testID="theme-font-size">{preferences.fontSize}</Text>;
}

function ScreenHarness() {
  const [showScreen, setShowScreen] = useState(true);

  return (
    <>
      {showScreen ? <PersonalizationSetupScreen /> : null}
      <ThemeProbe />
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowScreen(false)}
      >
        <Text>Fechar setup</Text>
      </Pressable>
    </>
  );
}

function renderSetup() {
  const container = createApplicationContainer({
    storage: new InMemoryStorage(),
  });

  jest
    .spyOn(container.services.session, "bootstrap")
    .mockResolvedValue(onboardingSnapshot);
  const getPreferences = jest
    .spyOn(container.useCases.accessibilityPreferences.get, "execute")
    .mockResolvedValue(loadedPreferences);

  render(
    <ApplicationContainerProvider container={container}>
      <AccessibilityThemeProvider>
        <ApplicationSessionProvider>
          <ScreenHarness />
        </ApplicationSessionProvider>
      </AccessibilityThemeProvider>
    </ApplicationContainerProvider>,
  );

  return { container, getPreferences };
}

describe("PersonalizationSetupScreen", () => {
  it("loads and presents the complete current preferences", async () => {
    const { getPreferences } = renderSetup();

    expect(
      await screen.findByRole("header", {
        name: "Vamos deixar a tela mais confortável para você",
      }),
    ).toBeOnTheScreen();
    expect(getPreferences).toHaveBeenCalledWith({ userId: maria.id });
    expect(
      within(
        screen.getByLabelText("Tamanho da fonte"),
      ).getByRole("radio", { name: "Grande" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      within(
        screen.getByLabelText("Espaçamento"),
      ).getByRole("radio", { name: "Grande" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("updates the immediate preview without persisting", async () => {
    const { container } = renderSetup();
    const update = jest.spyOn(
      container.useCases.accessibilityPreferences.update,
      "execute",
    );
    const fontSizeGroup =
      await screen.findByLabelText("Tamanho da fonte");

    fireEvent.press(
      within(fontSizeGroup).getByRole("radio", { name: "Extra" }),
    );

    expect(screen.getByTestId("theme-font-size")).toHaveTextContent("extra");
    expect(update).not.toHaveBeenCalled();
  });

  it("saves the complete object before completing onboarding", async () => {
    const { container } = renderSetup();
    const savedPreferences: AccessibilityPreferences = {
      ...loadedPreferences,
      contrast: "high",
    };
    const update = jest
      .spyOn(container.useCases.accessibilityPreferences.update, "execute")
      .mockResolvedValue(savedPreferences);
    const complete = jest
      .spyOn(container.services.session, "completeOnboarding")
      .mockResolvedValue(readySnapshot);
    const contrastGroup = await screen.findByLabelText("Contraste");

    fireEvent.press(
      within(contrastGroup).getByRole("radio", { name: "Alto" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Começar" }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        userId: maria.id,
        preferences: savedPreferences,
      });
      expect(complete).toHaveBeenCalledTimes(1);
    });
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      complete.mock.invocationCallOrder[0],
    );
  });

  it("keeps the choices and permits retry after a save error", async () => {
    const { container } = renderSetup();
    const update = jest
      .spyOn(container.useCases.accessibilityPreferences.update, "execute")
      .mockRejectedValue(new Error("storage failed"));
    const complete = jest.spyOn(
      container.services.session,
      "completeOnboarding",
    );
    const fontSizeGroup =
      await screen.findByLabelText("Tamanho da fonte");

    fireEvent.press(
      within(fontSizeGroup).getByRole("radio", { name: "Extra" }),
    );
    fireEvent.press(screen.getByRole("button", { name: "Começar" }));

    expect(
      await screen.findByRole("alert", {
        name: /não foi possível salvar suas preferências/i,
      }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("theme-font-size")).toHaveTextContent("extra");
    expect(complete).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Começar" }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
  });

  it("rolls the preview back when unmounted before a successful save", async () => {
    renderSetup();
    const fontSizeGroup =
      await screen.findByLabelText("Tamanho da fonte");

    fireEvent.press(
      within(fontSizeGroup).getByRole("radio", { name: "Extra" }),
    );
    expect(screen.getByTestId("theme-font-size")).toHaveTextContent("extra");

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Fechar setup" }));
    });

    expect(screen.getByTestId("theme-font-size")).toHaveTextContent("large");
  });
});
