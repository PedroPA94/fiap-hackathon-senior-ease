import { describe, expect, it, vi } from "vitest";

import {
  ApplicationError,
  GetHomeActivityOverviewUseCase,
} from "../../../src/application";
import {
  completeActivity,
  completeActivityStep,
  createActivity,
  DomainError,
  type Activity,
  type CreateActivityInput,
} from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";

const today = "2026-07-09";
const createdAt = "2026-07-09T10:00:00.000Z";
const completedAt = "2026-07-09T12:00:00.000Z";

describe("GetHomeActivityOverviewUseCase", () => {
  it("rejects an empty user id before reading the clock or repository", async () => {
    const { clock, repository, useCase } = makeUseCase();
    const listSpy = vi.spyOn(repository, "list");
    const todaySpy = vi.spyOn(clock, "today");

    await expect(useCase.execute({ userId: " " })).rejects.toEqual(
      new DomainError("ACTIVITY_USER_ID_REQUIRED"),
    );
    expect(listSpy).not.toHaveBeenCalled();
    expect(todaySpy).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])(
    "rejects invalid recent activity limit %s before dependencies are accessed",
    async (recentActivitiesLimit) => {
      const { clock, repository, useCase } = makeUseCase();
      const listSpy = vi.spyOn(repository, "list");
      const todaySpy = vi.spyOn(clock, "today");

      await expect(
        useCase.execute({ userId: "user-1", recentActivitiesLimit }),
      ).rejects.toEqual(new ApplicationError("ACTIVITY_RECENT_LIMIT_INVALID"));
      expect(listSpy).not.toHaveBeenCalled();
      expect(todaySpy).not.toHaveBeenCalled();
    },
  );

  it("uses today once and lists the user activities exactly once", async () => {
    const { clock, repository, useCase } = makeUseCase();
    const listSpy = vi.spyOn(repository, "list");
    const todaySpy = vi.spyOn(clock, "today");

    await useCase.execute({ userId: "user-1" });

    expect(todaySpy).toHaveBeenCalledOnce();
    expect(listSpy).toHaveBeenCalledOnce();
    expect(listSpy).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("produces all projections from the same repository result", async () => {
    const { repository, useCase } = makeUseCase();
    await addActivities(repository, [
      makeActivity({ id: "next", date: today }),
      makeInProgressActivity("in-progress", today),
      makeCompletedActivity("completed", today, completedAt),
    ]);
    const listSpy = vi.spyOn(repository, "list");

    const overview = await useCase.execute({ userId: "user-1" });

    expect(overview.nextActivity?.id).toBe("in-progress");
    expect(overview.recentCompletedActivities.map(({ id }) => id)).toEqual([
      "completed",
    ]);
    expect(overview.todaySummary).toEqual({
      pending: 1,
      inProgress: 1,
      completed: 1,
    });
    expect(listSpy).toHaveBeenCalledOnce();
  });

  describe("next activity", () => {
    it("ignores completed activities and returns null without candidates", async () => {
      const { repository, useCase } = makeUseCase();
      await repository.create(
        makeCompletedActivity("completed", today, completedAt),
      );

      await expect(
        useCase.execute({ userId: "user-1" }),
      ).resolves.toMatchObject({ nextActivity: null });
    });

    it("orders overdue before today and today before future activities", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({ id: "future", date: "2026-07-10" }),
        makeActivity({ id: "today", date: today }),
        makeActivity({ id: "overdue", date: "2026-07-08" }),
      ]);

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.nextActivity?.id).toBe("overdue");

      repository.activities.delete("overdue");
      const withoutOverdue = await useCase.execute({ userId: "user-1" });
      expect(withoutOverdue.nextActivity?.id).toBe("today");
    });

    it("orders earlier dates before later dates in the same group", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({ id: "later", date: "2026-07-12" }),
        makeActivity({ id: "earlier", date: "2026-07-10" }),
      ]);

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.nextActivity?.id).toBe("earlier");
    });

    it("orders timed activities before untimed ones and by ascending time", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({ id: "untimed" }),
        makeActivity({ id: "late", time: "16:00" }),
        makeActivity({ id: "early", time: "08:30" }),
      ]);

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.nextActivity?.id).toBe("early");
    });

    it("uses createdAt and then id as deterministic tie breakers", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({
          id: "created-later",
          createdAt: "2026-07-09T11:00:00.000Z",
        }),
        makeActivity({ id: "b-same-created" }),
        makeActivity({ id: "a-same-created" }),
      ]);

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.nextActivity?.id).toBe("a-same-created");
    });

    it("does not mutate the repository array or its activity steps", async () => {
      const activity = makeActivity({ id: "candidate" });
      activity.steps.reverse();
      const activities = [
        makeActivity({ id: "future", date: "2026-07-10" }),
        activity,
      ];
      const repository = new InMemoryActivityRepository();
      vi.spyOn(repository, "list").mockResolvedValue(activities);
      const useCase = new GetHomeActivityOverviewUseCase(
        repository,
        new FakeClock(),
      );

      const overview = await useCase.execute({ userId: "user-1" });

      expect(activities.map(({ id }) => id)).toEqual(["future", "candidate"]);
      expect(activity.steps.map(({ order }) => order)).toEqual([2, 1]);
      expect(overview.nextActivity?.steps.map(({ order }) => order)).toEqual([
        1, 2,
      ]);
    });
  });

  describe("recent completed activities", () => {
    it("keeps completed activities only and sorts them by updatedAt descending", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({ id: "pending" }),
        makeCompletedActivity("oldest", today, "2026-07-09T11:00:00.000Z"),
        makeCompletedActivity("newest", today, "2026-07-09T14:00:00.000Z"),
        makeCompletedActivity("middle", today, "2026-07-09T13:00:00.000Z"),
      ]);

      const overview = await useCase.execute({
        userId: "user-1",
        recentActivitiesLimit: 3,
      });

      expect(overview.recentCompletedActivities.map(({ id }) => id)).toEqual([
        "newest",
        "middle",
        "oldest",
      ]);
    });

    it("uses limit two by default and respects a custom limit", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeCompletedActivity("first", today, "2026-07-09T11:00:00.000Z"),
        makeCompletedActivity("second", today, "2026-07-09T12:00:00.000Z"),
        makeCompletedActivity("third", today, "2026-07-09T13:00:00.000Z"),
      ]);

      const defaultOverview = await useCase.execute({ userId: "user-1" });
      const customOverview = await useCase.execute({
        userId: "user-1",
        recentActivitiesLimit: 1,
      });

      expect(defaultOverview.recentCompletedActivities).toHaveLength(2);
      expect(
        customOverview.recentCompletedActivities.map(({ id }) => id),
      ).toEqual(["third"]);
    });

    it("returns an empty list when there are no completed activities", async () => {
      const { repository, useCase } = makeUseCase();
      await repository.create(makeActivity());

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.recentCompletedActivities).toEqual([]);
    });
  });

  describe("today summary", () => {
    it("counts each derived status only for today's activities", async () => {
      const { repository, useCase } = makeUseCase();
      await addActivities(repository, [
        makeActivity({ id: "pending", date: today }),
        makeInProgressActivity("in-progress", today),
        makeCompletedActivity("completed", today, completedAt),
        makeActivity({ id: "other-day", date: "2026-07-10" }),
      ]);

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.todaySummary).toEqual({
        pending: 1,
        inProgress: 1,
        completed: 1,
      });
    });

    it("returns zeroes when there are no activities today", async () => {
      const { repository, useCase } = makeUseCase();
      await repository.create(
        makeActivity({ id: "tomorrow", date: "2026-07-10" }),
      );

      const overview = await useCase.execute({ userId: "user-1" });

      expect(overview.todaySummary).toEqual({
        pending: 0,
        inProgress: 0,
        completed: 0,
      });
    });
  });
});

function makeUseCase() {
  const repository = new InMemoryActivityRepository();
  const clock = new FakeClock("2026-07-09T12:00:00.000Z", today);
  const useCase = new GetHomeActivityOverviewUseCase(repository, clock);

  return { clock, repository, useCase };
}

function makeActivity(overrides: Partial<CreateActivityInput> = {}): Activity {
  return createActivity({
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    date: today,
    steps: [
      { id: "step-2", description: "Beber água", order: 2 },
      { id: "step-1", description: "Pegar o remédio", order: 1 },
    ],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  });
}

function makeInProgressActivity(id: string, date: string): Activity {
  return completeActivityStep(
    makeActivity({ id, date }),
    "step-1",
    completedAt,
  );
}

function makeCompletedActivity(
  id: string,
  date: string,
  updatedAt: string,
): Activity {
  return completeActivity(makeActivity({ id, date }), updatedAt);
}

async function addActivities(
  repository: InMemoryActivityRepository,
  activities: Activity[],
): Promise<void> {
  await Promise.all(activities.map((activity) => repository.create(activity)));
}
