import type {
  Clock,
  UserProfile,
  UserProfileRepository,
} from "@senior-ease/core";

import { AsyncStorageUserProfileRepository } from "../../infrastructure/repositories/user-profile";
import { LocalSessionStore } from "../../infrastructure/session";
import { InMemoryStorage } from "../../infrastructure/storage";
import {
  ApplicationSessionError,
  ApplicationSessionService,
} from "./application-session-service";

const firstAccess = "2026-07-20T12:00:00.000Z";
const selectedAccess = "2026-07-24T15:30:00.000Z";

const maria: UserProfile = {
  id: "user-1",
  name: "Maria",
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const jose: UserProfile = {
  id: "user-2",
  name: "José",
  createdAt: "2026-07-21T10:00:00.000Z",
  updatedAt: "2026-07-21T10:00:00.000Z",
};

describe("ApplicationSessionService", () => {
  let clock: jest.Mocked<Clock>;
  let repository: AsyncStorageUserProfileRepository;
  let sessionStore: LocalSessionStore;
  let service: ApplicationSessionService;

  beforeEach(() => {
    const storage = new InMemoryStorage();

    clock = {
      now: jest.fn(() => selectedAccess),
      today: jest.fn(() => "2026-07-24"),
    };
    repository = new AsyncStorageUserProfileRepository(storage);
    sessionStore = new LocalSessionStore(storage);
    service = new ApplicationSessionService(
      sessionStore,
      repository,
      clock,
    );
  });

  async function persistProfile(
    profile: UserProfile,
    lastAccessedAt = firstAccess,
  ) {
    await repository.create(profile);
    await sessionStore.upsertUser({
      id: profile.id,
      name: profile.name,
      lastAccessedAt,
    });
  }

  it("returns noProfiles when the index is empty", async () => {
    await expect(service.bootstrap()).resolves.toEqual({
      status: "noProfiles",
      users: [],
      currentUser: null,
    });
  });

  it("requires profile selection when users exist without a current user", async () => {
    await persistProfile(maria);

    await expect(service.bootstrap()).resolves.toMatchObject({
      status: "profileSelectionRequired",
      users: [{ id: maria.id }],
      currentUser: null,
    });
  });

  it("clears a current user missing from the index and preserves users", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId("missing-user");

    await expect(service.bootstrap()).resolves.toMatchObject({
      status: "profileSelectionRequired",
      users: [{ id: maria.id }],
    });
    await expect(sessionStore.getCurrentUserId()).resolves.toBeNull();
  });

  it("removes only an orphaned profile reference from the index", async () => {
    await persistProfile(jose);
    await sessionStore.upsertUser({
      id: maria.id,
      name: maria.name,
      lastAccessedAt: selectedAccess,
    });
    await sessionStore.setCurrentUserId(maria.id);

    await expect(service.bootstrap()).resolves.toMatchObject({
      status: "profileSelectionRequired",
      users: [{ id: jose.id }],
    });
    await expect(sessionStore.getCurrentUserId()).resolves.toBeNull();
    await expect(sessionStore.listUsers()).resolves.toEqual([
      {
        id: jose.id,
        name: jose.name,
        lastAccessedAt: firstAccess,
      },
    ]);
  });

  it("requires onboarding for a valid current user without a marker", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);

    await expect(service.bootstrap()).resolves.toMatchObject({
      status: "onboardingRequired",
      currentUser: maria,
    });
  });

  it("returns ready when onboarding is completed", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);
    await sessionStore.markOnboardingCompleted(maria.id);

    await expect(service.bootstrap()).resolves.toMatchObject({
      status: "ready",
      currentUser: maria,
    });
  });

  it("does not update lastAccessedAt during bootstrap", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);

    await service.bootstrap();

    expect(clock.now).not.toHaveBeenCalled();
    await expect(sessionStore.listUsers()).resolves.toEqual([
      {
        id: maria.id,
        name: maria.name,
        lastAccessedAt: firstAccess,
      },
    ]);
  });

  it("updates lastAccessedAt deterministically on explicit selection", async () => {
    await persistProfile(maria);

    await service.selectProfile(maria.id);

    expect(clock.now).toHaveBeenCalledTimes(1);
    await expect(sessionStore.listUsers()).resolves.toEqual([
      {
        id: maria.id,
        name: maria.name,
        lastAccessedAt: selectedAccess,
      },
    ]);
  });

  it("sets currentUserId after explicit selection", async () => {
    await persistProfile(maria);

    await expect(service.selectProfile(maria.id)).resolves.toMatchObject({
      status: "onboardingRequired",
      currentUser: maria,
    });
    await expect(sessionStore.getCurrentUserId()).resolves.toBe(maria.id);
  });

  it("rejects an identifier outside the index without corrupting the session", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);

    await expect(service.selectProfile("missing-user")).rejects.toEqual(
      new ApplicationSessionError("PROFILE_NOT_IN_INDEX"),
    );
    await expect(sessionStore.getCurrentUserId()).resolves.toBe(maria.id);
    await expect(sessionStore.listUsers()).resolves.toHaveLength(1);
  });

  it("registers and activates a profile without duplicating its identifier", async () => {
    await repository.create(maria);

    await service.registerProfile(maria);
    await service.registerProfile({ ...maria, name: "Maria Helena" });

    await expect(sessionStore.listUsers()).resolves.toEqual([
      {
        id: maria.id,
        name: "Maria Helena",
        lastAccessedAt: selectedAccess,
      },
    ]);
    await expect(sessionStore.getCurrentUserId()).resolves.toBe(maria.id);
  });

  it("preserves profiles with equal names and distinct identifiers", async () => {
    const secondMaria = { ...jose, name: maria.name };

    await repository.create(maria);
    await repository.create(secondMaria);
    await service.registerProfile(maria);
    await service.registerProfile(secondMaria);

    await expect(sessionStore.listUsers()).resolves.toHaveLength(2);
  });

  it("completes onboarding for the current user and returns ready", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);

    await expect(service.completeOnboarding()).resolves.toMatchObject({
      status: "ready",
      currentUser: maria,
    });
    await expect(
      sessionStore.isOnboardingCompleted(maria.id),
    ).resolves.toBe(true);
  });

  it("requires a current user to complete onboarding", async () => {
    await expect(service.completeOnboarding()).rejects.toEqual(
      new ApplicationSessionError("CURRENT_USER_REQUIRED"),
    );
  });

  it("clears the current profile and returns profile selection", async () => {
    await persistProfile(maria);
    await sessionStore.setCurrentUserId(maria.id);

    await expect(service.clearCurrentProfile()).resolves.toMatchObject({
      status: "profileSelectionRequired",
      currentUser: null,
    });
    await expect(sessionStore.getCurrentUserId()).resolves.toBeNull();
  });

  it("propagates real repository errors without sanitizing domain data", async () => {
    const repositoryError = new Error("StorageDataError");
    const failingRepository: UserProfileRepository = {
      findById: jest.fn().mockRejectedValue(repositoryError),
      create: jest.fn(),
    };
    const failingService = new ApplicationSessionService(
      sessionStore,
      failingRepository,
      clock,
    );

    await sessionStore.upsertUser({
      id: maria.id,
      name: maria.name,
      lastAccessedAt: firstAccess,
    });
    await sessionStore.setCurrentUserId(maria.id);

    await expect(failingService.bootstrap()).rejects.toBe(repositoryError);
    await expect(sessionStore.listUsers()).resolves.toHaveLength(1);
  });

  it("sanitizes an indexed profile that disappears during selection", async () => {
    await sessionStore.upsertUser({
      id: maria.id,
      name: maria.name,
      lastAccessedAt: firstAccess,
    });

    await expect(service.selectProfile(maria.id)).rejects.toEqual(
      new ApplicationSessionError("PROFILE_NOT_AVAILABLE"),
    );
    await expect(sessionStore.listUsers()).resolves.toEqual([]);
    await expect(sessionStore.getCurrentUserId()).resolves.toBeNull();
  });
});
