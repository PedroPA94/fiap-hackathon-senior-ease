import type {
  Activity,
  ListActivitiesByUserUseCaseInput,
  UserProfile,
} from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../../../providers";
import { ActivitiesScreen } from "./activities-screen";

const mockRouterPush = jest.fn();
const mockListActivities = jest.fn<
  Promise<Activity[]>,
  [ListActivitiesByUserUseCaseInput]
>();
const mockApplicationContainer = {
  useCases: {
    activities: {
      listByUser: {
        execute: mockListActivities,
      },
    },
  },
};

const mockMaria: UserProfile = {
  id: "user-1",
  name: "Maria Helena",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

jest.mock("expo-router", () => ({
  useFocusEffect: (
    callback: () => void | (() => void),
  ) => jest.requireActual("react").useEffect(callback, [callback]),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("../../../../providers", () => {
  const actual = jest.requireActual("../../../../providers");

  return {
    ...actual,
    useApplicationContainer: () => mockApplicationContainer,
    useApplicationSession: () => ({
      status: "ready",
      users: [],
      currentUser: mockMaria,
      error: null,
      retry: jest.fn(),
      createProfile: jest.fn(),
      selectProfile: jest.fn(),
      clearCurrentProfile: jest.fn(),
      completeOnboarding: jest.fn(),
    }),
  };
});

const pendingActivity: Activity = {
  id: "activity-1",
  userId: mockMaria.id,
  title: "Separar documentos",
  date: "2026-07-24",
  time: "14:00",
  steps: [
    {
      id: "step-1",
      description: "Encontrar a pasta",
      order: 1,
    },
  ],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const completedActivity: Activity = {
  ...pendingActivity,
  id: "activity-2",
  title: "Confirmar a consulta",
  steps: [
    {
      ...pendingActivity.steps[0],
      id: "step-2",
      completedAt: "2026-07-24T13:00:00.000Z",
    },
  ],
  updatedAt: "2026-07-24T13:00:00.000Z",
};

function renderActivities() {
  return render(
    <AccessibilityThemeProvider>
      <ActivitiesScreen />
    </AccessibilityThemeProvider>,
  );
}

describe("ActivitiesScreen", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockListActivities.mockReset();
  });

  it("shows loading and renders activities from the current user", async () => {
    let resolveActivities!: (activities: Activity[]) => void;
    mockListActivities.mockReturnValue(
      new Promise((resolve) => {
        resolveActivities = resolve;
      }),
    );

    renderActivities();

    expect(
      screen.getByRole("progressbar", {
        name: "Carregando atividades...",
      }),
    ).toBeOnTheScreen();

    await act(async () => {
      resolveActivities([pendingActivity]);
    });

    expect(
      await screen.findByText(pendingActivity.title),
    ).toBeOnTheScreen();
    expect(mockListActivities).toHaveBeenCalledWith({
      userId: mockMaria.id,
      filter: "all",
    });
  });

  it("loads the selected filter through the core use case", async () => {
    mockListActivities.mockImplementation(async ({ filter }) =>
      filter === "completed" ? [completedActivity] : [pendingActivity],
    );

    renderActivities();
    await screen.findByText(pendingActivity.title);

    fireEvent.press(
      screen.getByRole("radio", { name: "Concluídas" }),
    );

    expect(
      await screen.findByText(completedActivity.title),
    ).toBeOnTheScreen();
    expect(mockListActivities).toHaveBeenLastCalledWith({
      userId: mockMaria.id,
      filter: "completed",
    });
  });

  it("shows the empty message for the selected filter", async () => {
    mockListActivities.mockResolvedValue([]);

    renderActivities();
    await screen.findByText("Você ainda não criou nenhuma atividade.");

    fireEvent.press(screen.getByRole("radio", { name: "Hoje" }));

    expect(
      await screen.findByText(
        "Você não possui atividades para hoje.",
      ),
    ).toBeOnTheScreen();
  });

  it("retries an error without changing the selected filter", async () => {
    mockListActivities
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("storage failed"))
      .mockResolvedValueOnce([pendingActivity]);

    renderActivities();
    await screen.findByText("Você ainda não criou nenhuma atividade.");

    fireEvent.press(screen.getByRole("radio", { name: "Hoje" }));

    expect(
      await screen.findByRole("alert", {
        name: activityErrorMessagePattern,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(
      await screen.findByText(pendingActivity.title),
    ).toBeOnTheScreen();
    expect(mockListActivities).toHaveBeenLastCalledWith({
      userId: mockMaria.id,
      filter: "today",
    });
    expect(mockListActivities).toHaveBeenCalledTimes(3);
  });

  it("navigates to creation and steps using the activity id", async () => {
    mockListActivities.mockResolvedValue([pendingActivity]);

    renderActivities();
    await screen.findByText(pendingActivity.title);

    fireEvent.press(
      screen.getByRole("button", { name: "Nova atividade" }),
    );
    fireEvent.press(
      screen.getByRole("button", {
        name: `Ver etapas de ${pendingActivity.title}`,
      }),
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenNthCalledWith(
        1,
        "/activities/new",
      );
      expect(mockRouterPush).toHaveBeenNthCalledWith(2, {
        pathname: "/activities/[activityId]",
        params: { activityId: pendingActivity.id },
      });
    });
  });
});

const activityErrorMessagePattern =
  /não foi possível carregar suas atividades\. tente novamente\./i;
