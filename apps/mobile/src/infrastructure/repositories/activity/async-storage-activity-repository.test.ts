import type { Activity } from "@senior-ease/core";

import {
  InMemoryStorage,
  StorageDataError,
  storageKeys,
} from "../../storage";
import { AsyncStorageActivityRepository } from "./async-storage-activity-repository";

describe("AsyncStorageActivityRepository", () => {
  const userId = "user-1";
  const key = storageKeys.activities(userId);

  let storage: InMemoryStorage;
  let repository: AsyncStorageActivityRepository;

  beforeEach(() => {
    storage = new InMemoryStorage();
    repository = new AsyncStorageActivityRepository(storage);
  });

  it("returns an empty list and null when the user has no activities", async () => {
    await expect(repository.list({ userId })).resolves.toEqual([]);
    await expect(
      repository.findById({ userId, activityId: "missing" }),
    ).resolves.toBeNull();
  });

  it("creates a normalized activity and preserves completedAt", async () => {
    const activity = makeActivity({
      title: "  Tomar remédio  ",
      steps: [
        {
          id: "step-2",
          description: "  Beber água  ",
          order: 2,
          completedAt: "2026-07-23T12:10:00.000Z",
        },
        { id: "step-1", description: "  Pegar o remédio  ", order: 1 },
      ],
    });

    const created = await repository.create(activity);

    expect(created.title).toBe("Tomar remédio");
    expect(created.steps.map((step) => step.id)).toEqual(["step-1", "step-2"]);
    expect(created.steps[1]?.completedAt).toBe("2026-07-23T12:10:00.000Z");
    await expect(storage.getItem(key)).resolves.toBe(JSON.stringify([created]));
  });

  it("keeps activities isolated by user", async () => {
    await repository.create(makeActivity());
    await repository.create(
      makeActivity({ id: "activity-2", userId: "user-2" }),
    );

    await expect(repository.list({ userId })).resolves.toEqual([
      expect.objectContaining({ id: "activity-1", userId }),
    ]);
    await expect(repository.list({ userId: "user-2" })).resolves.toEqual([
      expect.objectContaining({ id: "activity-2", userId: "user-2" }),
    ]);
  });

  it("filters activities by date", async () => {
    await repository.create(makeActivity());
    await repository.create(
      makeActivity({ id: "activity-2", date: "2026-07-24" }),
    );

    const activities = await repository.list({
      userId,
      date: "2026-07-24",
    });

    expect(activities.map((activity) => activity.id)).toEqual(["activity-2"]);
  });

  it("finds an activity by its complete identity", async () => {
    await repository.create(makeActivity());

    await expect(
      repository.findById({ userId, activityId: "activity-1" }),
    ).resolves.toEqual(expect.objectContaining({ id: "activity-1", userId }));
    await expect(
      repository.findById({
        userId: "user-2",
        activityId: "activity-1",
      }),
    ).resolves.toBeNull();
  });

  it("rejects invalid and duplicated activities without replacing data", async () => {
    await expect(
      repository.create(makeActivity({ title: " " })),
    ).rejects.toThrow();
    await expect(storage.getItem(key)).resolves.toBeNull();

    await repository.create(makeActivity());
    const storedValue = await storage.getItem(key);

    await expect(repository.create(makeActivity())).rejects.toMatchObject({
      code: "ACTIVITY_ALREADY_EXISTS",
    });
    await expect(storage.getItem(key)).resolves.toBe(storedValue);
  });

  it("updates an existing activity", async () => {
    await repository.create(makeActivity());

    const updated = await repository.update(
      makeActivity({
        title: "Atividade atualizada",
        updatedAt: "2026-07-23T13:00:00.000Z",
      }),
    );

    expect(updated.title).toBe("Atividade atualizada");
    await expect(storage.getItem(key)).resolves.toBe(JSON.stringify([updated]));
  });

  it("rejects updates for missing activities", async () => {
    await expect(repository.update(makeActivity())).rejects.toMatchObject({
      code: "ACTIVITY_NOT_FOUND",
    });
    await expect(storage.getItem(key)).resolves.toBeNull();
  });

  it("deletes an activity without affecting other activities", async () => {
    await repository.create(makeActivity());
    await repository.create(makeActivity({ id: "activity-2" }));

    await repository.delete({ userId, activityId: "activity-1" });

    await expect(repository.list({ userId })).resolves.toEqual([
      expect.objectContaining({ id: "activity-2" }),
    ]);
  });

  it("removes the user key after deleting the last activity", async () => {
    await repository.create(makeActivity());

    await repository.delete({ userId, activityId: "activity-1" });

    await expect(storage.getItem(key)).resolves.toBeNull();
  });

  it("treats deletion of a missing activity as idempotent", async () => {
    await repository.create(makeActivity());
    const storedValue = await storage.getItem(key);

    await repository.delete({ userId, activityId: "missing" });

    await expect(storage.getItem(key)).resolves.toBe(storedValue);
  });

  it.each([
    ["malformed JSON", "{invalid-json"],
    ["a non-array value", JSON.stringify(makeActivity())],
    [
      "an invalid activity",
      JSON.stringify([{ ...makeActivity(), steps: "invalid" }]),
    ],
    [
      "an activity from another user",
      JSON.stringify([makeActivity({ userId: "user-2" })]),
    ],
  ])("rejects %s without deleting stored data", async (_case, storedValue) => {
    await storage.setItem(key, storedValue);

    await expect(repository.list({ userId })).rejects.toMatchObject({
      name: "StorageDataError",
      key,
    });
    await expect(storage.getItem(key)).resolves.toBe(storedValue);
  });

  it("wraps parsing failures with their original cause", async () => {
    await storage.setItem(key, "{invalid-json");

    try {
      await repository.list({ userId });
      throw new Error("Expected repository.list to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(StorageDataError);
      expect((error as StorageDataError).cause).toBeInstanceOf(SyntaxError);
    }
  });

  function makeActivity(overrides: Partial<Activity> = {}): Activity {
    return {
      id: "activity-1",
      userId,
      title: "Tomar remédio",
      description: "Após o almoço",
      date: "2026-07-23",
      time: "12:30",
      steps: [
        { id: "step-1", description: "Pegar o remédio", order: 1 },
        { id: "step-2", description: "Beber água", order: 2 },
      ],
      createdAt: "2026-07-23T12:00:00.000Z",
      updatedAt: "2026-07-23T12:00:00.000Z",
      ...overrides,
    };
  }
});
