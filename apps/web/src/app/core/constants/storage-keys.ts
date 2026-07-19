import type { EntityId } from '@senior-ease/core';

const STORAGE_PREFIX = 'senior-ease';

export const storageKeys = {
  currentUserId: `${STORAGE_PREFIX}:current-user-id`,

  userIndex: `${STORAGE_PREFIX}:user-index`,

  userProfile: (userId: EntityId) => `${STORAGE_PREFIX}:users:${userId}:profile`,

  accessibilityPreferences: (userId: EntityId) =>
    `${STORAGE_PREFIX}:users:${userId}:accessibility-preferences`,

  onboardingCompleted: (userId: EntityId) =>
    `${STORAGE_PREFIX}:users:${userId}:onboarding-completed`,

  activities: (userId: EntityId) => `${STORAGE_PREFIX}:users:${userId}:activities`,
} as const;
