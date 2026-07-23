import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@senior-ease/core";

import { InMemoryStorage, storageKeys } from "../../storage";
import { AsyncStorageAccessibilityPreferencesRepository } from "./async-storage-accessibility-preferences-repository";

describe("AsyncStorageAccessibilityPreferencesRepository", () => {
  const userId = "user-1";
  const key = storageKeys.accessibilityPreferences(userId);
  const preferences: AccessibilityPreferences = {
    fontSize: "large",
    contrast: "high",
    spacing: "wide",
    interfaceMode: "advanced",
    enhancedFeedback: false,
    confirmCriticalActions: false,
    remindersEnabled: true,
    reminderAdvance: "oneHour",
  };

  let storage: InMemoryStorage;
  let repository: AsyncStorageAccessibilityPreferencesRepository;

  beforeEach(() => {
    storage = new InMemoryStorage();
    repository = new AsyncStorageAccessibilityPreferencesRepository(storage);
  });

  it("returns null when preferences are not stored", async () => {
    await expect(repository.findByUserId(userId)).resolves.toBeNull();
  });

  it("reads valid stored preferences", async () => {
    await storage.setItem(key, JSON.stringify(preferences));

    await expect(repository.findByUserId(userId)).resolves.toEqual(preferences);
  });

  it("saves valid preferences under the user key", async () => {
    await expect(repository.save(userId, preferences)).resolves.toEqual(
      preferences,
    );
    await expect(storage.getItem(key)).resolves.toBe(
      JSON.stringify(preferences),
    );
  });

  it.each([
    ["malformed JSON", "{invalid-json"],
    [
      "invalid preferences",
      JSON.stringify({ ...preferences, fontSize: "tiny" }),
    ],
  ])("rejects %s without deleting stored data", async (_case, storedValue) => {
    await storage.setItem(key, storedValue);

    await expect(repository.findByUserId(userId)).rejects.toMatchObject({
      name: "StorageDataError",
      key,
    });
    await expect(storage.getItem(key)).resolves.toBe(storedValue);
  });

  it("rejects invalid preferences without storing them", async () => {
    const invalidPreferences = {
      ...defaultAccessibilityPreferences,
      contrast: "very-high",
    } as unknown as AccessibilityPreferences;

    await expect(
      repository.save(userId, invalidPreferences),
    ).rejects.toThrow();
    await expect(storage.getItem(key)).resolves.toBeNull();
  });

  it("keeps preferences isolated by user", async () => {
    await repository.save(userId, preferences);
    await repository.save("user-2", defaultAccessibilityPreferences);

    await expect(repository.findByUserId(userId)).resolves.toEqual(preferences);
    await expect(repository.findByUserId("user-2")).resolves.toEqual(
      defaultAccessibilityPreferences,
    );
  });
});
