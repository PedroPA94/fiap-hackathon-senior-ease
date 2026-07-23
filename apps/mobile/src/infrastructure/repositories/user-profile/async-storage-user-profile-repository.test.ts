import type { UserProfile } from "@senior-ease/core";

import { InMemoryStorage, storageKeys } from "../../storage";
import { AsyncStorageUserProfileRepository } from "./async-storage-user-profile-repository";

describe("AsyncStorageUserProfileRepository", () => {
  const userId = "user-1";
  const key = storageKeys.userProfile(userId);
  const profile: UserProfile = {
    id: userId,
    name: "Maria Silva",
    createdAt: "2026-07-23T12:00:00.000Z",
    updatedAt: "2026-07-23T12:00:00.000Z",
  };

  let storage: InMemoryStorage;
  let repository: AsyncStorageUserProfileRepository;

  beforeEach(() => {
    storage = new InMemoryStorage();
    repository = new AsyncStorageUserProfileRepository(storage);
  });

  it("returns null when the profile is not stored", async () => {
    await expect(repository.findById(userId)).resolves.toBeNull();
  });

  it("reads and normalizes a valid stored profile", async () => {
    await storage.setItem(
      key,
      JSON.stringify({ ...profile, name: "  Maria Silva  " }),
    );

    await expect(repository.findById(userId)).resolves.toEqual(profile);
  });

  it("creates and stores a normalized profile", async () => {
    const input = { ...profile, name: "  Maria Silva  " };

    await expect(repository.create(input)).resolves.toEqual(profile);
    await expect(storage.getItem(key)).resolves.toBe(JSON.stringify(profile));
  });

  it.each([
    ["malformed JSON", "{invalid-json"],
    ["a non-object value", JSON.stringify("profile")],
    ["a missing property", JSON.stringify({ ...profile, updatedAt: undefined })],
    ["an invalid profile", JSON.stringify({ ...profile, name: " " })],
    [
      "a profile with another identifier",
      JSON.stringify({ ...profile, id: "user-2" }),
    ],
  ])("rejects %s without deleting stored data", async (_case, storedValue) => {
    await storage.setItem(key, storedValue);

    await expect(repository.findById(userId)).rejects.toMatchObject({
      name: "StorageDataError",
      key,
    });
    await expect(storage.getItem(key)).resolves.toBe(storedValue);
  });

  it("rejects invalid input without storing it", async () => {
    const invalidProfile = {
      ...profile,
      createdAt: 123,
    } as unknown as UserProfile;

    await expect(repository.create(invalidProfile)).rejects.toThrow();
    await expect(storage.getItem(key)).resolves.toBeNull();
  });
});
