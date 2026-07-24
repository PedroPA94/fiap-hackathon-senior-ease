import type {
  Activity,
  CreateActivityUseCaseInput,
  UserProfile,
} from "@senior-ease/core";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../../../providers";
import { ActivityCreateScreen } from "./activity-create-screen";

const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockCreateActivity = jest.fn<
  Promise<Activity>,
  [CreateActivityUseCaseInput]
>();
const mockApplicationContainer = {
  useCases: {
    activities: {
      create: {
        execute: mockCreateActivity,
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

const createdActivity = {
  id: "activity-1",
  userId: mockMaria.id,
  title: "Consulta",
  date: "2026-08-05",
  steps: [
    {
      id: "step-1",
      description: "Separar documentos",
      order: 1,
    },
  ],
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
} satisfies Activity;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockRouterBack,
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

function renderCreateActivity() {
  return render(
    <AccessibilityThemeProvider>
      <ActivityCreateScreen />
    </AccessibilityThemeProvider>,
  );
}

function fillRequiredFields() {
  fireEvent.changeText(
    screen.getByLabelText("Título, campo obrigatório"),
    "  Consulta  ",
  );
  fireEvent.changeText(
    screen.getByLabelText("Data, campo obrigatório"),
    "05082026",
  );
  fireEvent.changeText(
    screen.getByLabelText("Descrição da etapa 1"),
    "  Separar documentos  ",
  );
}

describe("ActivityCreateScreen", () => {
  beforeEach(() => {
    mockRouterBack.mockReset();
    mockRouterReplace.mockReset();
    mockCreateActivity.mockReset();
  });

  it("renders the form with one initial step", () => {
    renderCreateActivity();

    expect(screen.getByText("Nova atividade")).toBeOnTheScreen();
    expect(screen.getByText("Etapa 1")).toBeOnTheScreen();
    expect(
      screen.getByLabelText("Descrição da etapa 1"),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Etapa 2")).not.toBeOnTheScreen();
  });

  it("adds, reorders and removes steps", () => {
    renderCreateActivity();

    fireEvent.press(
      screen.getByRole("button", { name: "Adicionar etapa" }),
    );
    fireEvent.changeText(
      screen.getByLabelText("Descrição da etapa 1"),
      "Primeira",
    );
    fireEvent.changeText(
      screen.getByLabelText("Descrição da etapa 2"),
      "Segunda",
    );

    fireEvent.press(
      screen.getAllByRole("button", { name: "Subir" })[1],
    );

    expect(
      screen.getByLabelText("Descrição da etapa 1").props.value,
    ).toBe("Segunda");
    expect(
      screen.getByLabelText("Descrição da etapa 2").props.value,
    ).toBe("Primeira");

    fireEvent.press(
      screen.getByRole("button", { name: "Remover etapa 2" }),
    );

    expect(screen.queryByText("Etapa 2")).not.toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Remover etapa 1" }),
    ).toBeDisabled();
  });

  it("shows friendly validation messages for required fields", () => {
    renderCreateActivity();

    fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    expect(
      screen.getByText("Digite um nome para a atividade."),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("Escolha uma data para a atividade."),
    ).toBeOnTheScreen();
    expect(screen.getByText("Descreva esta etapa.")).toBeOnTheScreen();
    expect(mockCreateActivity).not.toHaveBeenCalled();
  });

  it("submits normalized values to the use case", async () => {
    mockCreateActivity.mockResolvedValue(createdActivity);
    renderCreateActivity();
    fillRequiredFields();
    fireEvent.changeText(
      screen.getByLabelText("Hora (opcional)"),
      "0907",
    );
    fireEvent.changeText(
      screen.getByLabelText("Descrição (opcional)"),
      "  Levar exames  ",
    );

    fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledWith({
        userId: mockMaria.id,
        title: "Consulta",
        date: "2026-08-05",
        time: "09:07",
        description: "Levar exames",
        steps: ["Separar documentos"],
      });
    });
  });

  it("returns to the activities list after a successful save", async () => {
    mockCreateActivity.mockResolvedValue(createdActivity);
    renderCreateActivity();
    fillRequiredFields();

    fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/(tabs)/activities",
      );
    });
  });

  it("keeps the form values when persistence fails", async () => {
    mockCreateActivity.mockRejectedValue(new Error("storage failed"));
    renderCreateActivity();
    fillRequiredFields();

    fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    expect(
      await screen.findByRole("alert", {
        name: /não foi possível salvar a atividade/i,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText("Título, campo obrigatório").props.value,
    ).toBe("  Consulta  ");
    expect(
      screen.getByLabelText("Descrição da etapa 1").props.value,
    ).toBe("  Separar documentos  ");
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
