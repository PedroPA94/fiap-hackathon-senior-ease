import { describe, expect, it, vi } from "vitest";

import { DeleteActivityUseCase } from "../../../src/application";
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
  const useCase = new DeleteActivityUseCase(repository);

  return { repository, useCase };
}

describe("DeleteActivityUseCase", () => {
  it("deletes an activity through the repository", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).resolves.toBeUndefined();

    await expect(
      repository.findById({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).resolves.toBeNull();
  });

  it("delegates the complete activity identity to delete", async () => {
    const { repository, useCase } = makeUseCase();
    const deleteSpy = vi.spyOn(repository, "delete");

    await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

    expect(deleteSpy).toHaveBeenCalledOnce();
    expect(deleteSpy).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "activity-1",
    });
  });

  it("does not look up the activity before requesting deletion", async () => {
    const { repository, useCase } = makeUseCase();
    const findByIdSpy = vi.spyOn(repository, "findById");

    await useCase.execute({
      userId: "user-1",
      activityId: "activity-1",
    });

    expect(findByIdSpy).not.toHaveBeenCalled();
  });

  it("delegates deletion of a missing activity to the repository", async () => {
    const { repository, useCase } = makeUseCase();
    const deleteSpy = vi.spyOn(repository, "delete");

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "missing-activity",
      }),
    ).resolves.toBeUndefined();

    expect(deleteSpy).toHaveBeenCalledWith({
      userId: "user-1",
      activityId: "missing-activity",
    });
  });

  it("relies on the repository to isolate activities by user", async () => {
    const { repository, useCase } = makeUseCase();
    await repository.create(makeActivity());

    await useCase.execute({
      userId: "user-2",
      activityId: "activity-1",
    });

    await expect(
      repository.findById({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "activity-1" }));
  });

  it.each([
    [{ userId: " ", activityId: "activity-1" }, "ACTIVITY_USER_ID_REQUIRED"],
    [{ userId: "user-1", activityId: " " }, "ACTIVITY_ID_REQUIRED"],
  ] as const)("validates input with %s", async (input, expectedCode) => {
    const { repository, useCase } = makeUseCase();
    const deleteSpy = vi.spyOn(repository, "delete");

    await expect(useCase.execute(input)).rejects.toThrow(DomainError);
    await expect(useCase.execute(input)).rejects.toThrow(
      expect.objectContaining({ code: expectedCode }),
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("propagates repository deletion errors", async () => {
    const { repository, useCase } = makeUseCase();
    const repositoryError = new Error("Repository unavailable");
    vi.spyOn(repository, "delete").mockRejectedValue(repositoryError);

    await expect(
      useCase.execute({
        userId: "user-1",
        activityId: "activity-1",
      }),
    ).rejects.toBe(repositoryError);
  });
});
