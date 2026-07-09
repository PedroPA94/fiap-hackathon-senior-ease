import { describe, expect, it } from "vitest";

import {
  completeActivity,
  completeActivityStep,
  createActivity,
  DomainError,
  getActivityProgress,
  getActivityStepsView,
  getCurrentActivityStep,
  resolveActivityStatus,
  type Activity,
  type CreateActivityInput,
} from "../../../src/domain";

const createdAt = "2026-07-09T12:00:00.000Z";
const laterAt = "2026-07-09T13:00:00.000Z";
const previousAt = "2026-07-09T11:00:00.000Z";

function makeActivityInput(
  overrides: Partial<CreateActivityInput> = {},
): CreateActivityInput {
  return {
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    description: "Após o almoço",
    date: "2026-07-09",
    time: "12:30",
    steps: [
      { id: "step-2", description: "Separar copo de água", order: 2 },
      { id: "step-1", description: "Pegar o remédio", order: 1 },
    ],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function makeActivity(overrides: Partial<CreateActivityInput> = {}): Activity {
  return createActivity(makeActivityInput(overrides));
}

function expectDomainError(fn: () => unknown, code: string): void {
  expect(fn).toThrow(DomainError);
  expect(fn).toThrow(expect.objectContaining({ code }));
}

describe("Activity entity", () => {
  it("creates a valid Activity", () => {
    const activity = makeActivity();

    expect(activity).toMatchObject({
      id: "activity-1",
      userId: "user-1",
      title: "Tomar remédio",
      description: "Após o almoço",
      date: "2026-07-09",
      time: "12:30",
      createdAt,
      updatedAt: createdAt,
    });
    expect(activity.steps).toHaveLength(2);
  });

  it("normalizes title, description and step descriptions", () => {
    const activity = makeActivity({
      title: "  Tomar remédio  ",
      description: "  Após o almoço  ",
      steps: [
        { id: "step-1", description: "  Pegar o remédio  ", order: 1 },
      ],
    });

    expect(activity.title).toBe("Tomar remédio");
    expect(activity.description).toBe("Após o almoço");
    expect(activity.steps[0]?.description).toBe("Pegar o remédio");
  });

  it("sorts steps by order", () => {
    const activity = makeActivity();

    expect(activity.steps.map((step) => step.id)).toEqual(["step-1", "step-2"]);
  });

  it("rejects an empty id", () => {
    expectDomainError(() => makeActivity({ id: "" }), "ACTIVITY_ID_REQUIRED");
  });

  it("rejects an empty userId", () => {
    expectDomainError(
      () => makeActivity({ userId: "" }),
      "ACTIVITY_USER_ID_REQUIRED",
    );
  });

  it("rejects an empty title", () => {
    expectDomainError(
      () => makeActivity({ title: "   " }),
      "ACTIVITY_TITLE_REQUIRED",
    );
  });

  it("rejects an empty date", () => {
    expectDomainError(() => makeActivity({ date: "" }), "ACTIVITY_DATE_REQUIRED");
  });

  it("rejects an invalid date", () => {
    expectDomainError(
      () => makeActivity({ date: "2026-07-09T12:00:00.000Z" }),
      "ACTIVITY_DATE_INVALID",
    );
  });

  it("rejects activity without steps", () => {
    expectDomainError(() => makeActivity({ steps: [] }), "ACTIVITY_STEPS_REQUIRED");
  });

  it("rejects a step with empty id", () => {
    expectDomainError(
      () =>
        makeActivity({
          steps: [{ id: "", description: "Pegar o remédio", order: 1 }],
        }),
      "ACTIVITY_STEP_ID_REQUIRED",
    );
  });

  it("rejects a step with empty description", () => {
    expectDomainError(
      () =>
        makeActivity({
          steps: [{ id: "step-1", description: "   ", order: 1 }],
        }),
      "ACTIVITY_STEP_DESCRIPTION_REQUIRED",
    );
  });

  it("rejects a step with order lower than 1", () => {
    expectDomainError(
      () =>
        makeActivity({
          steps: [{ id: "step-1", description: "Pegar o remédio", order: 0 }],
        }),
      "ACTIVITY_STEP_ORDER_INVALID",
    );
  });

  it("rejects duplicated step ids", () => {
    expectDomainError(
      () =>
        makeActivity({
          steps: [
            { id: "step-1", description: "Pegar o remédio", order: 1 },
            { id: "step-1", description: "Beber água", order: 2 },
          ],
        }),
      "ACTIVITY_STEP_IDS_DUPLICATED",
    );
  });

  it("rejects duplicated step orders", () => {
    expectDomainError(
      () =>
        makeActivity({
          steps: [
            { id: "step-1", description: "Pegar o remédio", order: 1 },
            { id: "step-2", description: "Beber água", order: 1 },
          ],
        }),
      "ACTIVITY_STEP_ORDERS_DUPLICATED",
    );
  });

  it("resolves pending status when no step is completed", () => {
    expect(resolveActivityStatus(makeActivity())).toBe("pending");
  });

  it("resolves inProgress status when some steps are completed", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", laterAt);

    expect(resolveActivityStatus(activity)).toBe("inProgress");
  });

  it("resolves completed status when all steps are completed", () => {
    const activity = completeActivity(makeActivity(), laterAt);

    expect(resolveActivityStatus(activity)).toBe("completed");
  });

  it("returns completed and total steps progress", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", laterAt);

    expect(getActivityProgress(activity)).toEqual({
      completedSteps: 1,
      totalSteps: 2,
    });
  });

  it("returns the first uncompleted step considering order", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", laterAt);

    expect(getCurrentActivityStep(activity)?.id).toBe("step-2");
  });

  it("returns null current step when all steps are completed", () => {
    expect(getCurrentActivityStep(completeActivity(makeActivity(), laterAt))).toBeNull();
  });

  it("returns sorted steps view with completed, current and pending statuses", () => {
    const activity = makeActivity({
      steps: [
        {
          id: "step-3",
          description: "Guardar embalagem",
          order: 3,
        },
        {
          id: "step-1",
          description: "Pegar o remédio",
          order: 1,
        },
        {
          id: "step-2",
          description: "Beber água",
          order: 2,
        },
      ],
    });

    const updatedActivity = completeActivityStep(activity, "step-1", laterAt);

    expect(
      getActivityStepsView(updatedActivity).map((step) => ({
        id: step.id,
        viewStatus: step.viewStatus,
      })),
    ).toEqual([
      { id: "step-1", viewStatus: "completed" },
      { id: "step-2", viewStatus: "current" },
      { id: "step-3", viewStatus: "pending" },
    ]);
  });

  it("marks only the informed step as completed", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", laterAt);

    expect(activity.steps.find((step) => step.id === "step-1")?.completedAt).toBe(
      laterAt,
    );
    expect(
      activity.steps.find((step) => step.id === "step-2")?.completedAt,
    ).toBeUndefined();
  });

  it("updates updatedAt with the informed completedAt when completing a step", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", laterAt);

    expect(activity.updatedAt).toBe(laterAt);
  });

  it("throws when stepId does not exist", () => {
    expectDomainError(
      () => completeActivityStep(makeActivity(), "missing-step", laterAt),
      "ACTIVITY_STEP_NOT_FOUND",
    );
  });

  it("completes all steps", () => {
    const activity = completeActivity(makeActivity(), laterAt);

    expect(activity.steps.every((step) => step.completedAt === laterAt)).toBe(true);
  });

  it("preserves existing step completedAt when completing all steps", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", previousAt);
    const completedActivity = completeActivity(activity, laterAt);

    expect(
      completedActivity.steps.find((step) => step.id === "step-1")?.completedAt,
    ).toBe(previousAt);
    expect(
      completedActivity.steps.find((step) => step.id === "step-2")?.completedAt,
    ).toBe(laterAt);
  });

  it("updates updatedAt when completing all steps", () => {
    const activity = completeActivity(makeActivity(), laterAt);

    expect(activity.updatedAt).toBe(laterAt);
  });
});
