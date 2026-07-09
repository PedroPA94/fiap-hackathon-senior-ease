import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  CompleteActivityUseCase,
} from "../../../src/application";
import { completeActivityStep, createActivity } from "../../../src/domain";
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
  const useCase = new CompleteActivityUseCase(repository, clock);

  return { repository, useCase };
}

describe("CompleteActivityUseCase", () => {
  it("finds activity, completes all steps and persists the update", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({ activityId: "activity-1" });

    await expect(repository.findById("activity-1")).resolves.toBe(activity);
    expect(
      activity.steps.every(
        (step) => step.completedAt === "2026-07-09T12:00:00.000Z",
      ),
    ).toBe(true);
  });

  it("sets pending steps completedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({ activityId: "activity-1" });

    expect(activity.steps.map((step) => step.completedAt)).toEqual([
      "2026-07-09T12:00:00.000Z",
      "2026-07-09T12:00:00.000Z",
    ]);
  });

  it("preserves completedAt from already completed steps", async () => {
    const { repository, useCase } = makeUseCase();
    const activity = completeActivityStep(
      makeActivity(),
      "step-1",
      "2026-07-09T11:30:00.000Z",
    );
    await repository.create(activity);

    const completedActivity = await useCase.execute({ activityId: "activity-1" });

    expect(
      completedActivity.steps.find((step) => step.id === "step-1")?.completedAt,
    ).toBe("2026-07-09T11:30:00.000Z");
    expect(
      completedActivity.steps.find((step) => step.id === "step-2")?.completedAt,
    ).toBe("2026-07-09T12:00:00.000Z");
  });

  it("sets activity updatedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({ activityId: "activity-1" });

    expect(activity.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("throws ApplicationError ACTIVITY_NOT_FOUND when repository does not find activity", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ activityId: "missing-activity" }),
    ).rejects.toThrow(ApplicationError);
    await expect(
      useCase.execute({ activityId: "missing-activity" }),
    ).rejects.toThrow(expect.objectContaining({ code: "ACTIVITY_NOT_FOUND" }));
  });
});
