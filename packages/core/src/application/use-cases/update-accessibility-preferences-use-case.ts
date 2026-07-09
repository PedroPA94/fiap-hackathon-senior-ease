import {
  assertNonEmpty,
  type AccessibilityPreferences,
  type EntityId,
} from "../../domain";
import { validateAccessibilityPreferences } from "../../domain/";
import type { AccessibilityPreferencesRepository } from "../repositories";

export type UpdateAccessibilityPreferencesUseCaseInput = {
  userId: EntityId;
  preferences: AccessibilityPreferences;
};

export class UpdateAccessibilityPreferencesUseCase {
  constructor(
    private readonly accessibilityPreferencesRepository: AccessibilityPreferencesRepository,
  ) {}

  async execute(
    input: UpdateAccessibilityPreferencesUseCaseInput,
  ): Promise<AccessibilityPreferences> {
    assertNonEmpty(input.userId, "ACCESSIBILITY_USER_ID_REQUIRED");
    validateAccessibilityPreferences(input.preferences);

    return this.accessibilityPreferencesRepository.save(
      input.userId,
      input.preferences,
    );
  }
}
