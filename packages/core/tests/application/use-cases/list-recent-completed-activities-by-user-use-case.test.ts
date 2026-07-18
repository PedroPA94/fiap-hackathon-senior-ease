import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "../../../src/application";
import { ListRecentCompletedActivitiesByUserUseCase } from "../../../src/application/use-cases/list-recent-completed-activities-by-user-use-case";
import {
  completeActivity,
  completeActivityStep,
  createActivity,
  type Activity,
  type CreateActivityInput,
} from "../../../src/domain";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";

const createdAt = "2026-07-09T10:00:00.000Z";
const completedAt = "2026-07-09T12:00:00.000Z";

function makeActivityInput(
  overrides: Partial<CreateActivityInput> = {},
): CreateActivityInput {
  return {
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    date: "2026-07-09",
    steps: [
      { id: "step-2", description: "Beber água", order: 2 },
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

function makeCompletedActivity(
  id: string,
  updatedAt: string,
  userId = "user-1",
): Activity {
  return completeActivity(
    makeActivity({
      id,
      userId,
      steps: [
        { id: `${id}-step-2`, description: "Beber água", order: 2 },
        { id: `${id}-step-1`, description: "Pegar o remédio", order: 1 },
      ],
    }),
    updatedAt,
  );
}

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const useCase = new ListRecentCompletedActivitiesByUserUseCase(repository);

  return { repository, useCase };
}

describe("ListRecentCompletedActivitiesByUserUseCase", () => {
  it("lists only completed activities from the informed user", async () => {
    const { repository, useCase } = makeUseCase();
    const pendingActivity = makeActivity({ id: "pending-activity" });
    const inProgressActivity = completeActivityStep(
      makeActivity({ id: "in-progress-activity" }),
      "step-1",
      completedAt,
    );
    const completedActivity = makeCompletedActivity(
      "completed-activity",
      "2026-07-09T13:00:00.000Z",
    );
    const otherUserActivity = makeCompletedActivity(
      "other-user-activity",
      "2026-07-09T14:00:00.000Z",
      "user-2",
    );
    await repository.create(pendingActivity);
    await repository.create(inProgressActivity);
    await repository.create(completedActivity);
    await repository.create(otherUserActivity);

    const activities = await useCase.execute({ userId: "user-1" });

    expect(activities.map((activity) => activity.id)).toEqual([
      "completed-activity",
    ]);
  });

  it("queries the repository with the informed user id", async () => {
    const { repository, useCase } = makeUseCase();
    const listSpy = vi.spyOn(repository, "list");

    await useCase.execute({ userId: "user-1" });

    expect(listSpy).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("sorts completed activities from most recently updated to oldest", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(
      makeCompletedActivity("oldest", "2026-07-09T11:00:00.000Z"),
    );
    await repository.create(
      makeCompletedActivity("newest", "2026-07-09T15:00:00.000Z"),
    );
    await repository.create(
      makeCompletedActivity("middle", "2026-07-09T13:00:00.000Z"),
    );

    const activities = await useCase.execute({ userId: "user-1" });

    expect(activities.map((activity) => activity.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("returns at most five activities by default", async () => {
    const { repository, useCase } = makeUseCase();

    for (let index = 1; index <= 6; index += 1) {
      await repository.create(
        makeCompletedActivity(
          `activity-${index}`,
          `2026-07-09T${String(10 + index).padStart(2, "0")}:00:00.000Z`,
        ),
      );
    }

    const activities = await useCase.execute({ userId: "user-1" });

    expect(activities).toHaveLength(5);
    expect(activities.map((activity) => activity.id)).toEqual([
      "activity-6",
      "activity-5",
      "activity-4",
      "activity-3",
      "activity-2",
    ]);
  });

  it("respects a custom limit", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(
      makeCompletedActivity("activity-1", "2026-07-09T11:00:00.000Z"),
    );
    await repository.create(
      makeCompletedActivity("activity-2", "2026-07-09T12:00:00.000Z"),
    );
    await repository.create(
      makeCompletedActivity("activity-3", "2026-07-09T13:00:00.000Z"),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      limit: 2,
    });

    expect(activities.map((activity) => activity.id)).toEqual([
      "activity-3",
      "activity-2",
    ]);
  });

  it("returns activity steps sorted by order without mutating the repository entity", async () => {
    const { repository, useCase } = makeUseCase();
    const activity = makeCompletedActivity(
      "completed-activity",
      "2026-07-09T13:00:00.000Z",
    );
    activity.steps.reverse();
    await repository.create(activity);

    const [result] = await useCase.execute({ userId: "user-1" });

    expect(result?.steps.map((step) => step.order)).toEqual([1, 2]);
    expect(activity.steps.map((step) => step.order)).toEqual([2, 1]);
  });

  it("returns an empty list when there are no completed activities", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "pending-activity" }));

    await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws ACTIVITY_RECENT_LIMIT_INVALID for invalid limit %s",
    async (limit) => {
      const { useCase } = makeUseCase();

      await expect(
        useCase.execute({ userId: "user-1", limit }),
      ).rejects.toThrow(ApplicationError);
      await expect(
        useCase.execute({ userId: "user-1", limit }),
      ).rejects.toThrow(
        expect.objectContaining({ code: "ACTIVITY_RECENT_LIMIT_INVALID" }),
      );
    },
  );

  it("propagates repository errors", async () => {
    const { repository, useCase } = makeUseCase();
    const repositoryError = new Error("Repository unavailable");
    vi.spyOn(repository, "list").mockRejectedValue(repositoryError);

    await expect(useCase.execute({ userId: "user-1" })).rejects.toBe(
      repositoryError,
    );
  });
});
