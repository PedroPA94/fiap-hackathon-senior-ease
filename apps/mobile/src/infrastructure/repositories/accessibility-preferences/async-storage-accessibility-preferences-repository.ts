import {
  validateAccessibilityPreferences,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type EntityId,
} from "@senior-ease/core";

import type { Storage } from "../../storage";
import { StorageDataError, storageKeys } from "../../storage";

export class AsyncStorageAccessibilityPreferencesRepository
  implements AccessibilityPreferencesRepository
{
  constructor(private readonly storage: Storage) {}

  async findByUserId(
    userId: EntityId,
  ): Promise<AccessibilityPreferences | null> {
    const key = storageKeys.accessibilityPreferences(userId);
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);

      return validateAccessibilityPreferences(parsedValue);
    } catch (error) {
      throw new StorageDataError(key, error);
    }
  }

  async save(
    userId: EntityId,
    preferences: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences> {
    const validatedPreferences =
      validateAccessibilityPreferences(preferences);

    await this.storage.setItem(
      storageKeys.accessibilityPreferences(userId),
      JSON.stringify(validatedPreferences),
    );

    return validatedPreferences;
  }
}
