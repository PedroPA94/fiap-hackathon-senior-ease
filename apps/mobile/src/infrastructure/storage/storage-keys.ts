import type { EntityId } from "@senior-ease/core";

const STORAGE_PREFIX = "senior-ease";

export const storageKeys = {
  currentUserId: `${STORAGE_PREFIX}:current-user-id`,

  userIndex: `${STORAGE_PREFIX}:user-index`,

  userProfile: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:user-profile:${userId}`,

  accessibilityPreferences: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:accessibility-preferences:${userId}`,

  onboardingCompleted: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:onboarding-completed:${userId}`,

  activities: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:activities:${userId}`,
} as const;
