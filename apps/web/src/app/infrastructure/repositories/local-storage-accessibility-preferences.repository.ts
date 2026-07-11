import { Injectable } from '@angular/core';

import {
  validateAccessibilityPreferences,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type EntityId,
} from '@senior-ease/core';

@Injectable()
export class LocalStorageAccessibilityPreferencesRepository implements AccessibilityPreferencesRepository {
  async findByUserId(userId: EntityId): Promise<AccessibilityPreferences | null> {
    const storageKey = this.getStorageKey(userId);
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as AccessibilityPreferences;

      validateAccessibilityPreferences(parsedValue);

      return parsedValue;
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

    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(preferences));

    return preferences;
  }

  private getStorageKey(userId: EntityId): string {
    return `senior-ease:users:${userId}:accessibility-preferences`;
  }
}
