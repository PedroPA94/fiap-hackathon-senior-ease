import { describe, expect, it, vi } from "vitest";

import {
  ApplicationError,
  CompleteActivityStepUseCase,
} from "../../../src/application";
import {
  createActivity,
  DomainError,
  type CreateActivityInput,
} from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";

function makeActivity(overrides: Partial<CreateActivityInput> = {}) {
  return createActivity({
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    date: "2026-07-09",
    steps: [
      { id: "step-1", description: "Pegar o remédio", order: 1 },
      { id: "step-2", description: "Beber água", order: 2 },
    ],
    createdAt: "2026-07-09T11:00:00.000Z",
    updatedAt: "2026-07-09T11:00:00.000Z",
    ...overrides,
  });
}

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const clock = new FakeClock();
  const useCase = new CompleteActivityStepUseCase(repository, clock);

  return { repository, useCase };
}

describe("CompleteActivityStepUseCase", () => {
  it("completes only the informed step and persists the update", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const updatedActivity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
      stepId: "step-1",
    });

    await expect(
      repository.findById({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).resolves.toBe(updatedActivity);
    expect(
      updatedActivity.steps.find((step) => step.id === "step-1")?.completedAt,
    ).toBe("2026-07-09T12:00:00.000Z");
    expect(
      updatedActivity.steps.find((step) => step.id === "step-2")?.completedAt,
    ).toBeUndefined();
  });

  it("queries the activity using both activity and user identities", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());
    const findByIdSpy = vi.spyOn(repository, "findById");

    await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
      stepId: "step-1",
    });

    expect(findByIdSpy).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "activity-1",
    });
  });

  it("sets step completedAt and activity updatedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
      stepId: "step-1",
    });

    expect(
      activity.steps.find((step) => step.id === "step-1")?.completedAt,
    ).toBe("2026-07-09T12:00:00.000Z");
    expect(activity.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("throws ACTIVITY_NOT_FOUND when the repository does not find the activity", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "missing-activity",
        stepId: "step-1",
      }),
    ).rejects.toThrow(ApplicationError);
    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "missing-activity",
        stepId: "step-1",
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "ACTIVITY_NOT_FOUND" }));
  });

  it("throws ACTIVITY_NOT_FOUND when the repository returns another user's activity", async () => {
    const { repository, useCase } = makeUseCase();
    vi.spyOn(repository, "findById").mockResolvedValue(
      makeActivity({ userId: "user-2" }),
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "activity-1",
        stepId: "step-1",
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "ACTIVITY_NOT_FOUND" }));
  });

  it("throws ACTIVITY_STEP_NOT_FOUND when the step does not exist", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "activity-1",
        stepId: "missing-step",
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "activity-1",
        stepId: "missing-step",
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "ACTIVITY_STEP_NOT_FOUND" }),
    );
  });

  it.each([
    [
      { userId: " ", activityId: "activity-1", stepId: "step-1" },
      "ACTIVITY_USER_ID_REQUIRED",
    ],
    [
      { userId: "user-1", activityId: " ", stepId: "step-1" },
      "ACTIVITY_ID_REQUIRED",
    ],
    [
      { userId: "user-1", activityId: "activity-1", stepId: " " },
      "ACTIVITY_STEP_ID_REQUIRED",
    ],
  ] as const)("validates input with %s", async (input, expectedCode) => {
    const { repository, useCase } = makeUseCase();
    const findByIdSpy = vi.spyOn(repository, "findById");

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(
      expect.objectContaining({ code: expectedCode }),
    );
    expect(findByIdSpy).not.toHaveBeenCalled();
  });
});
