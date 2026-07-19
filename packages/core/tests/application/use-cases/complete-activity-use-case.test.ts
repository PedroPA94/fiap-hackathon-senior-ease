import { describe, expect, it, vi } from "vitest";

import {
  ApplicationError,
  CompleteActivityUseCase,
} from "../../../src/application";
import {
  completeActivityStep,
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
  const useCase = new CompleteActivityUseCase(repository, clock);

  return { repository, useCase };
}

describe("CompleteActivityUseCase", () => {
  it("completes all steps and persists the update", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

    await expect(
      repository.findById({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).resolves.toBe(activity);
    expect(
      activity.steps.every(
        (step) => step.completedAt === "2026-07-09T12:00:00.000Z",
      ),
    ).toBe(true);
  });

  it("queries the activity using both activity and user identities", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());
    const findByIdSpy = vi.spyOn(repository, "findById");

    await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

    expect(findByIdSpy).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "activity-1",
    });
  });

  it("sets pending steps completedAt with clock.now()", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    const activity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

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

    const completedActivity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

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

    const activity = await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

    expect(activity.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("throws ACTIVITY_NOT_FOUND when the repository does not find the activity", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "missing-activity",
      }),
    ).rejects.toThrow(ApplicationError);
    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "missing-activity",
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
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "ACTIVITY_NOT_FOUND" }));
  });

  it.each([
    [{ userId: " ", activityId: "activity-1" }, "ACTIVITY_USER_ID_REQUIRED"],
    [{ userId: "user-1", activityId: " " }, "ACTIVITY_ID_REQUIRED"],
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
