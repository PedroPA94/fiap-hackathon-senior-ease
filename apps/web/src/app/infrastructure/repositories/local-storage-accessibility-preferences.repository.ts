import { Injectable } from '@angular/core';

import {
  validateAccessibilityPreferences,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type EntityId,
} from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';

@Injectable()
export class LocalStorageAccessibilityPreferencesRepository implements AccessibilityPreferencesRepository {
  async findByUserId(userId: EntityId): Promise<AccessibilityPreferences | null> {
    const storageKey = storageKeys.accessibilityPreferences(userId);
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return validateAccessibilityPreferences(JSON.parse(rawValue));
    } catch {
      localStorage.removeItem(storageKey);

      return null;
    }
  }

  async save(
    userId: EntityId,
    preferences: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences> {
    validateAccessibilityPreferences(preferences);

    localStorage.setItem(storageKeys.accessibilityPreferences(userId), JSON.stringify(preferences));

    return preferences;
  }
}
