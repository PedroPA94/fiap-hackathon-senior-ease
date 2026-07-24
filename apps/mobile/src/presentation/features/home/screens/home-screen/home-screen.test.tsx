import {
  defaultAccessibilityPreferences,
  type Activity,
  type HomeActivityOverview,
  type UserProfile,
} from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import {
  AccessibilityThemeProvider,
  useAccessibilityTheme,
} from "../../../../providers";
import { HomeScreen } from "./home-screen";

const mockRouterPush = jest.fn();
const mockClearCurrentProfile = jest.fn<Promise<void>, []>();
const mockGetHomeOverview = jest.fn<
  Promise<HomeActivityOverview>,
  [{ userId: string }]
>();
const mockApplicationContainer = {
  useCases: {
    activities: {
      getHomeOverview: {
        execute: mockGetHomeOverview,
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
  useRouter: () => ({ push: mockRouterPush }),
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
      clearCurrentProfile: mockClearCurrentProfile,
      completeOnboarding: jest.fn(),
    }),
  };
});

const nextActivity: Activity = {
  id: "activity-1",
  userId: mockMaria.id,
  title: "Enviar documento para secretaria",
  date: "2026-07-24",
  time: "14:00",
  steps: [
    {
      id: "step-1",
      description: "Separar documento",
      order: 1,
    },
  ],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-24T10:00:00.000Z",
};

const completedActivity: Activity = {
  ...nextActivity,
  id: "activity-2",
  title: "Participar da aula online",
  steps: [
    {
      ...nextActivity.steps[0],
      id: "step-2",
      completedAt: "2026-07-23T18:00:00.000Z",
    },
  ],
  updatedAt: "2026-07-23T18:00:00.000Z",
};

const overview: HomeActivityOverview = {
  nextActivity,
  recentCompletedActivities: [completedActivity],
  reminders: [
    {
      activityId: nextActivity.id,
      title: nextActivity.title,
      date: nextActivity.date,
      time: nextActivity.time ?? "14:00",
      scheduledAt: new Date("2026-07-24T14:00:00"),
      reminderAt: new Date("2026-07-24T13:30:00"),
      hasTime: true,
    },
  ],
  todaySummary: {
    pending: 2,
    inProgress: 1,
    completed: 3,
  },
};

function ModeControl() {
  const { setPreferences } = useAccessibilityTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        setPreferences({
          ...defaultAccessibilityPreferences,
          interfaceMode: "advanced",
        })
      }
    >
      <Text>Ativar modo avançado</Text>
    </Pressable>
  );
}

function renderHome() {
  return render(
    <AccessibilityThemeProvider>
      <HomeScreen />
      <ModeControl />
    </AccessibilityThemeProvider>,
  );
}

describe("HomeScreen", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockClearCurrentProfile.mockReset();
    mockGetHomeOverview.mockReset();
  });

  it("shows the initial loading state", () => {
    mockGetHomeOverview.mockReturnValue(new Promise(() => undefined));

    renderHome();

    expect(
      screen.getByRole("progressbar", {
        name: "Preparando tudo para você...",
      }),
    ).toBeOnTheScreen();
  });

  it("renders the real overview after loading", async () => {
    mockGetHomeOverview.mockResolvedValue(overview);

    renderHome();

    expect(
      await screen.findByRole("header", {
        name: "Olá, Maria Helena!",
      }),
    ).toBeOnTheScreen();
    expect(screen.getAllByText(nextActivity.title)).not.toHaveLength(0);
    expect(
      screen.getByText("Você tem 3 atividades para fazer hoje."),
    ).toBeOnTheScreen();
    expect(mockGetHomeOverview).toHaveBeenCalledWith({
      userId: mockMaria.id,
    });
  });

  it("shows an error and retries the overview request", async () => {
    mockGetHomeOverview
      .mockRejectedValueOnce(new Error("storage failed"))
      .mockResolvedValueOnce(overview);

    renderHome();

    expect(
      await screen.findByRole("alert", {
        name: /não foi possível carregar o início/i,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findAllByText(nextActivity.title)).not.toHaveLength(0);
    expect(mockGetHomeOverview).toHaveBeenCalledTimes(2);
  });

  it("requests fresh data through pull-to-refresh", async () => {
    mockGetHomeOverview.mockResolvedValue(overview);

    renderHome();
    await screen.findAllByText(nextActivity.title);

    const refreshControl =
      screen.getByTestId("home-scroll-view").props.refreshControl;

    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() =>
      expect(mockGetHomeOverview).toHaveBeenCalledTimes(2),
    );
  });

  it("changes essential content between basic and advanced modes", async () => {
    mockGetHomeOverview.mockResolvedValue(overview);

    renderHome();
    await screen.findAllByText(nextActivity.title);

    expect(screen.queryByText("Histórico recente")).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Ajustar visual" }),
    ).not.toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Ativar modo avançado" }),
    );

    expect(screen.getByText("Histórico recente")).toBeOnTheScreen();
    expect(screen.getByText("Pendentes")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Ajustar visual" }),
    ).toBeOnTheScreen();
  });
});
