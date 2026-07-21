import { describe, expect, it, vi } from "vitest";

import {
  ApplicationError,
  GetActivityByIdUseCase,
} from "../../../src/application";
import {
  createActivity,
  DomainError,
  type CreateActivityInput,
} from "../../../src/domain";
import { InMemoryActivityRepository } from "../../helpers/in-memory-activity-repository";

function makeActivity(overrides: Partial<CreateActivityInput> = {}) {
  return createActivity({
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    date: "2026-07-20",
    steps: [{ id: "step-1", description: "Separar o remédio", order: 1 }],
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  });
}

describe("GetActivityByIdUseCase", () => {
  it("returns the activity and delegates the complete identity once", async () => {
    const repository = new InMemoryActivityRepository();
    const activity = makeActivity();
    await repository.create(activity);
    const findByIdSpy = vi.spyOn(repository, "findById");
    const useCase = new GetActivityByIdUseCase(repository);

    await expect(
      useCase.execute({ userId: "user-1", activityId: "activity-1" }),
    ).resolves.toBe(activity);
    expect(findByIdSpy).toHaveBeenCalledOnce();
    expect(findByIdSpy).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "activity-1",
    });
  });

  it.each([
    [{ userId: " ", activityId: "activity-1" }, "ACTIVITY_USER_ID_REQUIRED"],
    [{ userId: "user-1", activityId: " " }, "ACTIVITY_ID_REQUIRED"],
  ] as const)(
    "validates %s before accessing the repository",
    async (input, expectedCode) => {
      const repository = new InMemoryActivityRepository();
      const findByIdSpy = vi.spyOn(repository, "findById");
      const useCase = new GetActivityByIdUseCase(repository);

      await expect(useCase.execute(input)).rejects.toThrow(DomainError);
      await expect(useCase.execute(input)).rejects.toThrow(
        expect.objectContaining({ code: expectedCode }),
      );
      expect(findByIdSpy).not.toHaveBeenCalled();
    },
  );

  it("throws ACTIVITY_NOT_FOUND when the activity does not exist", async () => {
    const useCase = new GetActivityByIdUseCase(
      new InMemoryActivityRepository(),
    );

    await expect(
      useCase.execute({ userId: "user-1", activityId: "missing-activity" }),
    ).rejects.toEqual(new ApplicationError("ACTIVITY_NOT_FOUND"));
  });

  it("does not expose an activity owned by another user", async () => {
    const repository = new InMemoryActivityRepository();
    await repository.create(makeActivity());
    const useCase = new GetActivityByIdUseCase(repository);

    await expect(
      useCase.execute({ userId: "user-2", activityId: "activity-1" }),
    ).rejects.toEqual(new ApplicationError("ACTIVITY_NOT_FOUND"));
  });

  it("does not mutate the activity returned by the repository", async () => {
    const repository = new InMemoryActivityRepository();
    const activity = makeActivity();
    await repository.create(activity);
    const before = structuredClone(activity);
    const useCase = new GetActivityByIdUseCase(repository);

    await useCase.execute({ userId: "user-1", activityId: "activity-1" });

    expect(activity).toEqual(before);
  });
});
