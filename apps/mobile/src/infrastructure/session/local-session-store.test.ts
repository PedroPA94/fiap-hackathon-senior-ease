import type { LocalUserSummary } from "../../application/session";
import {
  InMemoryStorage,
  storageKeys,
} from "../storage";
import { LocalSessionStore } from "./local-session-store";

const maria: LocalUserSummary = {
  id: "user-1",
  name: "Maria",
  lastAccessedAt: "2026-07-24T12:00:00.000Z",
};

const jose: LocalUserSummary = {
  id: "user-2",
  name: "José",
  lastAccessedAt: "2026-07-25T12:00:00.000Z",
};

describe("LocalSessionStore", () => {
  let storage: InMemoryStorage;
  let store: LocalSessionStore;

  beforeEach(() => {
    storage = new InMemoryStorage();
    store = new LocalSessionStore(storage);
  });

  it("returns null when the current user is absent", async () => {
    await expect(store.getCurrentUserId()).resolves.toBeNull();
  });

  it("saves and reads the current user", async () => {
    await store.setCurrentUserId(maria.id);

    await expect(store.getCurrentUserId()).resolves.toBe(maria.id);
    await expect(storage.getItem(storageKeys.currentUserId)).resolves.toBe(
      JSON.stringify(maria.id),
    );
  });

  it("clears the current user", async () => {
    await store.setCurrentUserId(maria.id);
    await store.clearCurrentUserId();

    await expect(store.getCurrentUserId()).resolves.toBeNull();
  });

  it.each([
    ["malformed JSON", "{invalid-json"],
    ["a non-string value", JSON.stringify(123)],
    ["an empty identifier", JSON.stringify(" ")],
  ])("removes %s from currentUserId", async (_case, rawValue) => {
    await storage.setItem(storageKeys.currentUserId, rawValue);

    await expect(store.getCurrentUserId()).resolves.toBeNull();
    await expect(storage.getItem(storageKeys.currentUserId)).resolves.toBeNull();
  });

  it("returns an empty index when the key is absent", async () => {
    await expect(store.listUsers()).resolves.toEqual([]);
  });

  it("stores the first user", async () => {
    await store.upsertUser(maria);

    await expect(store.listUsers()).resolves.toEqual([maria]);
  });

  it("updates an existing identifier without duplicating it", async () => {
    await store.upsertUser(maria);
    await store.upsertUser({
      ...maria,
      name: "Maria Helena",
      lastAccessedAt: "2026-07-26T12:00:00.000Z",
    });

    await expect(store.listUsers()).resolves.toEqual([
      {
        ...maria,
        name: "Maria Helena",
        lastAccessedAt: "2026-07-26T12:00:00.000Z",
      },
    ]);
  });

  it("preserves equal names with distinct identifiers", async () => {
    await store.upsertUser(maria);
    await store.upsertUser({ ...jose, name: maria.name });

    await expect(store.listUsers()).resolves.toHaveLength(2);
  });

  it("orders by recent access and then by identifier", async () => {
    const sameAccess = {
      ...maria,
      id: "user-3",
    };

    await store.upsertUser(maria);
    await store.upsertUser(sameAccess);
    await store.upsertUser(jose);

    await expect(store.listUsers()).resolves.toEqual([
      jose,
      maria,
      sameAccess,
    ]);
  });

  it.each([
    ["malformed JSON", "{invalid-json"],
    ["a non-array value", JSON.stringify({ user: maria })],
  ])("removes an index containing %s", async (_case, rawValue) => {
    await storage.setItem(storageKeys.userIndex, rawValue);

    await expect(store.listUsers()).resolves.toEqual([]);
    await expect(storage.getItem(storageKeys.userIndex)).resolves.toBeNull();
  });

  it("discards invalid items, preserves valid users, and rewrites the index", async () => {
    await storage.setItem(
      storageKeys.userIndex,
      JSON.stringify([
        maria,
        { ...jose, lastAccessedAt: "not-a-date" },
        "invalid-item",
      ]),
    );

    await expect(store.listUsers()).resolves.toEqual([maria]);
    await expect(storage.getItem(storageKeys.userIndex)).resolves.toBe(
      JSON.stringify([maria]),
    );
  });

  it("keeps the first occurrence when duplicate identifiers are stored", async () => {
    await storage.setItem(
      storageKeys.userIndex,
      JSON.stringify([maria, { ...maria, name: "Duplicada" }]),
    );

    await expect(store.listUsers()).resolves.toEqual([maria]);
    await expect(storage.getItem(storageKeys.userIndex)).resolves.toBe(
      JSON.stringify([maria]),
    );
  });

  it("removes only the corrupted session key", async () => {
    const profileKey = storageKeys.userProfile(maria.id);

    await storage.setItem(storageKeys.userIndex, "{invalid-json");
    await storage.setItem(profileKey, "domain-data");

    await store.listUsers();

    await expect(storage.getItem(storageKeys.userIndex)).resolves.toBeNull();
    await expect(storage.getItem(profileKey)).resolves.toBe("domain-data");
  });

  it("reports onboarding as pending when its key is absent", async () => {
    await expect(store.isOnboardingCompleted(maria.id)).resolves.toBe(false);
  });

  it("stores and reads completed onboarding", async () => {
    await store.markOnboardingCompleted(maria.id);

    await expect(store.isOnboardingCompleted(maria.id)).resolves.toBe(true);
  });

  it.each([
    ["false", JSON.stringify(false)],
    ["a malformed value", "{invalid-json"],
    ["a non-boolean value", JSON.stringify("true")],
  ])("removes onboarding marker containing %s", async (_case, rawValue) => {
    const key = storageKeys.onboardingCompleted(maria.id);

    await storage.setItem(key, rawValue);

    await expect(store.isOnboardingCompleted(maria.id)).resolves.toBe(false);
    await expect(storage.getItem(key)).resolves.toBeNull();
  });

  it("removes one user while preserving the remaining index", async () => {
    await store.upsertUser(maria);
    await store.upsertUser(jose);

    await store.removeUser(jose.id);

    await expect(store.listUsers()).resolves.toEqual([maria]);
  });
});
