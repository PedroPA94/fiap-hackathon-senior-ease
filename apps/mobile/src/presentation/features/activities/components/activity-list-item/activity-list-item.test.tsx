import type { Activity } from "@senior-ease/core";
import { render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../../../providers";
import { ActivityListItem } from "./activity-list-item";

const activity: Activity = {
  id: "activity-1",
  userId: "user-1",
  title: "Organizar os documentos",
  description: "Separar os documentos necessários para a consulta.",
  date: "2026-07-24",
  time: "14:00",
  steps: [
    {
      id: "step-1",
      description: "Separar documentos",
      order: 1,
      completedAt: "2026-07-24T12:00:00.000Z",
    },
    {
      id: "step-2",
      description: "Guardar na pasta",
      order: 2,
    },
  ],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

describe("ActivityListItem", () => {
  it("presents the status and progress derived from the activity", async () => {
    render(
      <AccessibilityThemeProvider>
        <ActivityListItem
          activity={activity}
          onViewSteps={jest.fn()}
        />
      </AccessibilityThemeProvider>,
    );

    expect(
      await screen.findByLabelText("Status: Em andamento"),
    ).toBeOnTheScreen();
    expect(screen.getByText("1 de 2 etapas")).toBeOnTheScreen();
    expect(
      screen.getByRole("progressbar", {
        name: "1 de 2 etapas concluídas",
      }),
    ).toBeOnTheScreen();
  });
});
