import {
  assertNonEmpty,
  type AccessibilityPreferences,
  type EntityId,
} from "../../domain/index.js";
import { validateAccessibilityPreferences } from "../../domain/index.js";
import type { AccessibilityPreferencesRepository } from "../repositories/index.js";

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
