import {
  ApplicationError,
  type Activity,
  type CompleteActivityStepUseCaseInput,
  type CompleteActivityUseCaseInput,
  type GetActivityByIdUseCaseInput,
  type UserProfile,
} from "@senior-ease/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";

import { AccessibilityThemeProvider } from "../../../../providers";
import { ActivityGuidedScreen } from "./activity-guided-screen";

const mockRouterReplace = jest.fn();
const mockGetActivity = jest.fn<
  Promise<Activity>,
  [GetActivityByIdUseCaseInput]
>();
const mockCompleteStep = jest.fn<
  Promise<Activity>,
  [CompleteActivityStepUseCaseInput]
>();
const mockCompleteActivity = jest.fn<
  Promise<Activity>,
  [CompleteActivityUseCaseInput]
>();
const mockApplicationContainer = {
  useCases: {
    activities: {
      getById: { execute: mockGetActivity },
      completeStep: { execute: mockCompleteStep },
      complete: { execute: mockCompleteActivity },
    },
  },
};

const mockMaria: UserProfile = {
  id: "user-1",
  name: "Maria Helena",
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

const activity: Activity = {
  id: "activity-1",
  userId: mockMaria.id,
  title: "Enviar documento",
  description: "Enviar documentos necessários para a inscrição",
  date: "2026-07-24",
  time: "14:00",
  steps: [
    {
      id: "step-1",
      description: "Separar os documentos necessários",
      order: 1,
      completedAt: "2026-07-24T13:00:00.000Z",
    },
    {
      id: "step-2",
      description: "Digitalizar os documentos",
      order: 2,
    },
    {
      id: "step-3",
      description: "Entregar na secretaria",
      order: 3,
    },
  ],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-24T13:00:00.000Z",
};

const activityAfterStep: Activity = {
  ...activity,
  steps: activity.steps.map((step) =>
    step.id === "step-2"
      ? {
          ...step,
          completedAt: "2026-07-24T13:30:00.000Z",
        }
      : step,
  ),
  updatedAt: "2026-07-24T13:30:00.000Z",
};

const completedActivity: Activity = {
  ...activity,
  steps: activity.steps.map((step) => ({
    ...step,
    completedAt: step.completedAt ?? "2026-07-24T14:00:00.000Z",
  })),
  updatedAt: "2026-07-24T14:00:00.000Z",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
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

function renderGuidedActivity() {
  return render(
    <AccessibilityThemeProvider>
      <ActivityGuidedScreen activityId={activity.id} />
    </AccessibilityThemeProvider>,
  );
}

describe("ActivityGuidedScreen", () => {
  beforeEach(() => {
    mockRouterReplace.mockReset();
    mockGetActivity.mockReset();
    mockCompleteStep.mockReset();
    mockCompleteActivity.mockReset();
    jest.restoreAllMocks();
  });

  it("shows loading and then renders the loaded activity", async () => {
    let resolveActivity!: (value: Activity) => void;
    mockGetActivity.mockReturnValue(
      new Promise((resolve) => {
        resolveActivity = resolve;
      }),
    );

    renderGuidedActivity();

    expect(
      screen.getByRole("progressbar", {
        name: "Carregando atividade...",
      }),
    ).toBeOnTheScreen();

    await act(async () => {
      resolveActivity(activity);
    });

    expect(await screen.findByText(activity.title)).toBeOnTheScreen();
    expect(mockGetActivity).toHaveBeenCalledWith({
      activityId: activity.id,
      userId: mockMaria.id,
    });
  });

  it("renders completed, current and pending step states", async () => {
    mockGetActivity.mockResolvedValue(activity);
    renderGuidedActivity();

    expect(
      await screen.findByLabelText(
        /etapa 1: separar os documentos necessários\. concluída\./i,
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        /etapa 2: digitalizar os documentos\. etapa atual\./i,
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        /etapa 3: entregar na secretaria\. pendente\./i,
      ),
    ).toBeOnTheScreen();
  });

  it("completes only the current step and applies the returned activity", async () => {
    mockGetActivity.mockResolvedValue(activity);
    mockCompleteStep.mockResolvedValue(activityAfterStep);
    renderGuidedActivity();
    await screen.findByText(activity.title);

    fireEvent.press(
      screen.getByRole("button", { name: "Concluir etapa" }),
    );

    await waitFor(() => {
      expect(mockCompleteStep).toHaveBeenCalledWith({
        activityId: activity.id,
        stepId: "step-2",
        userId: mockMaria.id,
      });
    });
    expect(
      await screen.findByLabelText(
        /etapa 2: digitalizar os documentos\. concluída\./i,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText("Seu progresso foi salvo.")).toBeOnTheScreen();
  });

  it("confirms and completes the entire activity when required", async () => {
    mockGetActivity.mockResolvedValue(activity);
    mockCompleteActivity.mockResolvedValue(completedActivity);
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    renderGuidedActivity();
    await screen.findByText(activity.title);

    fireEvent.press(
      screen.getByRole("button", { name: "Concluir atividade" }),
    );

    expect(alert).toHaveBeenCalledWith(
      "Concluir atividade?",
      "Todas as etapas serão marcadas como concluídas.",
      expect.any(Array),
      expect.objectContaining({ cancelable: true }),
    );

    const buttons = alert.mock.calls[0]?.[2];
    const confirmButton = buttons?.find(
      (button) => button.text === "Concluir atividade",
    );
    confirmButton?.onPress?.();

    await waitFor(() => {
      expect(mockCompleteActivity).toHaveBeenCalledWith({
        activityId: activity.id,
        userId: mockMaria.id,
      });
    });
    expect(
      await screen.findByText("Todas as etapas foram concluídas."),
    ).toBeOnTheScreen();
  });

  it("shows the main error and retries loading", async () => {
    mockGetActivity
      .mockRejectedValueOnce(new Error("storage failed"))
      .mockResolvedValueOnce(activity);
    renderGuidedActivity();

    expect(
      await screen.findByRole("alert", {
        name: /não foi possível carregar esta atividade/i,
      }),
    ).toBeOnTheScreen();

    fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText(activity.title)).toBeOnTheScreen();
    expect(mockGetActivity).toHaveBeenCalledTimes(2);
  });

  it("shows not found for an unavailable activity", async () => {
    mockGetActivity.mockRejectedValue(
      new ApplicationError("ACTIVITY_NOT_FOUND"),
    );
    renderGuidedActivity();

    expect(
      await screen.findByText("Atividade não encontrada."),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Voltar para atividades" }),
    ).toBeOnTheScreen();
  });
});
