import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  CompleteActivityStepUseCase,
} from "../../../src/application";
import { createActivity, DomainError } from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";

function makeActivity() {
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
  });
}

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const clock = new FakeClock();
  const useCase = new CompleteActivityStepUseCase(repository, clock);

  return { repository, useCase };
}

describe("CompleteActivityStepUseCase", () => {
  it("finds activity, completes the informed step and persists the update", async () => {
    const { repository, useCase } = makeUseCase();
    const activity = makeActivity();
    await repository.create(activity);

    const updatedActivity = await useCase.execute({
      activityId: "activity-1",
      stepId: "step-1",
    });

    await expect(repository.findById("activity-1")).resolves.toBe(updatedActivity);
    expect(updatedActivity.steps.find((step) => step.id === "step-1")?.completedAt).toBe(
      "2026-07-09T12:00:00.000Z",
    );
    expect(
      updatedActivity.steps.find((step) => step.id === "step-2")?.completedAt,
    ).toBeUndefined();
  });

  it("sets step completedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({
      activityId: "activity-1",
      stepId: "step-1",
    });

    expect(activity.steps.find((step) => step.id === "step-1")?.completedAt).toBe(
      "2026-07-09T12:00:00.000Z",
    );
  });

  it("sets activity updatedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({
      activityId: "activity-1",
      stepId: "step-1",
    });

    expect(activity.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("throws ApplicationError ACTIVITY_NOT_FOUND when repository does not find activity", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ activityId: "missing-activity", stepId: "step-1" }),
    ).rejects.toThrow(ApplicationError);
    await expect(
      useCase.execute({ activityId: "missing-activity", stepId: "step-1" }),
    ).rejects.toThrow(expect.objectContaining({ code: "ACTIVITY_NOT_FOUND" }));
  });

  it("throws DomainError when stepId does not exist", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    await expect(
      useCase.execute({ activityId: "activity-1", stepId: "missing-step" }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({ activityId: "activity-1", stepId: "missing-step" }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "ACTIVITY_STEP_NOT_FOUND" }),
    );
  });
});
