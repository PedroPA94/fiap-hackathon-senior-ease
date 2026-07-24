import type {
  Clock,
  EntityId,
  UserProfile,
  UserProfileRepository,
} from "@senior-ease/core";

import type {
  ApplicationSessionSnapshot,
  ApplicationSessionStore,
  LocalUserSummary,
} from "./application-session";

export type ApplicationSessionErrorCode =
  | "CURRENT_USER_REQUIRED"
  | "PROFILE_NOT_IN_INDEX"
  | "PROFILE_NOT_AVAILABLE";

export class ApplicationSessionError extends Error {
  constructor(public readonly code: ApplicationSessionErrorCode) {
    super(code);
    this.name = "ApplicationSessionError";
  }
}

export class ApplicationSessionService {
  constructor(
    private readonly sessionStore: ApplicationSessionStore,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly clock: Clock,
  ) {}

  async bootstrap(): Promise<ApplicationSessionSnapshot> {
    const users = await this.sessionStore.listUsers();
    const currentUserId = await this.sessionStore.getCurrentUserId();

    if (users.length === 0) {
      if (currentUserId !== null) {
        await this.sessionStore.clearCurrentUserId();
      }

      return noProfilesSnapshot();
    }

    if (currentUserId === null) {
      return profileSelectionSnapshot(users);
    }

    const currentUserSummary = users.find((user) => user.id === currentUserId);

    if (!currentUserSummary) {
      await this.sessionStore.clearCurrentUserId();

      return profileSelectionSnapshot(users);
    }

    const currentUser = await this.userProfileRepository.findById(
      currentUserId,
    );

    if (!currentUser) {
      await this.removeOrphanedUser(currentUserId);

      return this.snapshotWithoutCurrentUser();
    }

    return this.snapshotForCurrentUser(users, currentUser);
  }

  async refresh(): Promise<ApplicationSessionSnapshot> {
    return this.bootstrap();
  }

  async registerProfile(
    profile: UserProfile,
  ): Promise<ApplicationSessionSnapshot> {
    await this.sessionStore.upsertUser({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: this.clock.now(),
    });
    await this.sessionStore.setCurrentUserId(profile.id);

    const users = await this.sessionStore.listUsers();

    return this.snapshotForCurrentUser(users, profile);
  }

  async selectProfile(
    userId: EntityId,
  ): Promise<ApplicationSessionSnapshot> {
    if (userId.trim().length === 0) {
      throw new ApplicationSessionError("PROFILE_NOT_IN_INDEX");
    }

    const users = await this.sessionStore.listUsers();
    const selectedUser = users.find((user) => user.id === userId);

    if (!selectedUser) {
      throw new ApplicationSessionError("PROFILE_NOT_IN_INDEX");
    }

    const profile = await this.userProfileRepository.findById(userId);

    if (!profile) {
      await this.removeOrphanedUser(userId);
      throw new ApplicationSessionError("PROFILE_NOT_AVAILABLE");
    }

    await this.sessionStore.upsertUser({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: this.clock.now(),
    });
    await this.sessionStore.setCurrentUserId(profile.id);

    return this.snapshotForCurrentUser(
      await this.sessionStore.listUsers(),
      profile,
    );
  }

  async clearCurrentProfile(): Promise<ApplicationSessionSnapshot> {
    await this.sessionStore.clearCurrentUserId();

    return this.snapshotWithoutCurrentUser();
  }

  async completeOnboarding(): Promise<ApplicationSessionSnapshot> {
    const snapshot = await this.bootstrap();

    if (
      snapshot.status !== "onboardingRequired" &&
      snapshot.status !== "ready"
    ) {
      throw new ApplicationSessionError("CURRENT_USER_REQUIRED");
    }

    await this.sessionStore.markOnboardingCompleted(snapshot.currentUser.id);

    return {
      ...snapshot,
      status: "ready",
    };
  }

  private async snapshotForCurrentUser(
    users: readonly LocalUserSummary[],
    currentUser: UserProfile,
  ): Promise<ApplicationSessionSnapshot> {
    const onboardingCompleted =
      await this.sessionStore.isOnboardingCompleted(currentUser.id);

    return {
      status: onboardingCompleted ? "ready" : "onboardingRequired",
      users: copyUsers(users),
      currentUser,
    };
  }

  private async snapshotWithoutCurrentUser(): Promise<ApplicationSessionSnapshot> {
    const users = await this.sessionStore.listUsers();

    return users.length === 0
      ? noProfilesSnapshot()
      : profileSelectionSnapshot(users);
  }

  private async removeOrphanedUser(userId: EntityId): Promise<void> {
    const currentUserId = await this.sessionStore.getCurrentUserId();

    if (currentUserId === userId) {
      await this.sessionStore.clearCurrentUserId();
    }

    await this.sessionStore.removeUser(userId);
  }
}

function noProfilesSnapshot(): ApplicationSessionSnapshot {
  return {
    status: "noProfiles",
    users: [],
    currentUser: null,
  };
}

function profileSelectionSnapshot(
  users: readonly LocalUserSummary[],
): ApplicationSessionSnapshot {
  return {
    status: "profileSelectionRequired",
    users: copyUsers(users),
    currentUser: null,
  };
}

function copyUsers(users: readonly LocalUserSummary[]): LocalUserSummary[] {
  return users.map((user) => ({ ...user }));
}
