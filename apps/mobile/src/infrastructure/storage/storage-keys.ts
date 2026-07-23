import type { EntityId } from "@senior-ease/core";

const STORAGE_PREFIX = "senior-ease";

export const storageKeys = {
  userProfile: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:user-profile:${userId}`,

  accessibilityPreferences: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:accessibility-preferences:${userId}`,

  activities: (userId: EntityId): string =>
    `${STORAGE_PREFIX}:activities:${userId}`,
} as const;
