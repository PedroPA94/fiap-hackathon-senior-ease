import type { AccessibilityPreferences, EntityId } from "../../domain";

export interface AccessibilityPreferencesRepository {
  findByUserId(userId: EntityId): Promise<AccessibilityPreferences | null>;

  save(
    userId: EntityId,
    preferences: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences>;
}
