import type { AccessibilityPreferencesRepository } from "../../src/application";
import type { AccessibilityPreferences, EntityId } from "../../src/domain";

export class InMemoryAccessibilityPreferencesRepository
  implements AccessibilityPreferencesRepository
{
  readonly preferencesByUserId = new Map<EntityId, AccessibilityPreferences>();

  async findByUserId(
    userId: EntityId,
  ): Promise<AccessibilityPreferences | null> {
    return this.preferencesByUserId.get(userId) ?? null;
  }

  async save(
    userId: EntityId,
    preferences: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences> {
    this.preferencesByUserId.set(userId, preferences);

    return preferences;
  }
}
