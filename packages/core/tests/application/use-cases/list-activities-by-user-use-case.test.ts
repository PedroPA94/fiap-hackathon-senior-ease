import { describe, expect, it } from "vitest";

import { ListActivitiesByUserUseCase } from "../../../src/application";
import {
  completeActivity,
  completeActivityStep,
  createActivity,
  type Activity,
  type CreateActivityInput,
} from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
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

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const clock = new FakeClock();
  const useCase = new ListActivitiesByUserUseCase(repository, clock);

  return { repository, useCase };
}

describe("ListActivitiesByUserUseCase", () => {
  it("lists activities from the informed user", async () => {
    const { repository, useCase } = makeUseCase();
    const userActivity = makeActivity({ id: "activity-1", userId: "user-1" });
    const otherUserActivity = makeActivity({
      id: "activity-2",
      userId: "user-2",
      steps: [{ id: "step-3", description: "Alongar", order: 1 }],
    });
    await repository.create(userActivity);
    await repository.create(otherUserActivity);

    const activities = await useCase.execute({ userId: "user-1" });

    expect(activities.map((activity) => activity.id)).toEqual(["activity-1"]);
  });

  it("returns all user activities when filter is all", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "activity-1" }));
    await repository.create(
      makeActivity({
        id: "activity-2",
        date: "2026-07-10",
        steps: [{ id: "step-3", description: "Caminhar", order: 1 }],
      }),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      filter: "all",
    });

    expect(activities.map((activity) => activity.id)).toEqual([
      "activity-1",
      "activity-2",
    ]);
  });

  it("filters activities by today's date using the clock", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "activity-1", date: "2026-07-09" }));
    await repository.create(
      makeActivity({
        id: "activity-2",
        date: "2026-07-10",
        steps: [{ id: "step-3", description: "Caminhar", order: 1 }],
      }),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      filter: "today",
    });

    expect(activities.map((activity) => activity.id)).toEqual(["activity-1"]);
  });

  it("filters pending activities by derived status", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "pending-activity" }));
    await repository.create(
      completeActivityStep(
        makeActivity({
          id: "in-progress-activity",
          steps: [
            { id: "step-3", description: "Pegar o remédio", order: 1 },
            { id: "step-4", description: "Beber água", order: 2 },
          ],
        }),
        "step-3",
        completedAt,
      ),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      filter: "pending",
    });

    expect(activities.map((activity) => activity.id)).toEqual([
      "pending-activity",
    ]);
  });

  it("filters inProgress activities by derived status", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "pending-activity" }));
    await repository.create(
      completeActivityStep(
        makeActivity({
          id: "in-progress-activity",
          steps: [
            { id: "step-3", description: "Pegar o remédio", order: 1 },
            { id: "step-4", description: "Beber água", order: 2 },
          ],
        }),
        "step-3",
        completedAt,
      ),
    );
    await repository.create(
      completeActivity(
        makeActivity({
          id: "completed-activity",
          steps: [{ id: "step-5", description: "Alongar", order: 1 }],
        }),
        completedAt,
      ),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      filter: "inProgress",
    });

    expect(activities.map((activity) => activity.id)).toEqual([
      "in-progress-activity",
    ]);
  });

  it("filters completed activities by derived status", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "pending-activity" }));
    await repository.create(
      completeActivity(
        makeActivity({
          id: "completed-activity",
          steps: [{ id: "step-3", description: "Alongar", order: 1 }],
        }),
        completedAt,
      ),
    );

    const activities = await useCase.execute({
      userId: "user-1",
      filter: "completed",
    });

    expect(activities.map((activity) => activity.id)).toEqual([
      "completed-activity",
    ]);
  });

  it("returns activity steps sorted by order", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity({ id: "activity-1" }));

    const [activity] = await useCase.execute({ userId: "user-1" });

    expect(activity?.steps.map((step) => step.id)).toEqual(["step-1", "step-2"]);
  });
});
