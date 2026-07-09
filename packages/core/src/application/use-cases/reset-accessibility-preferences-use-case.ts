import {
  assertNonEmpty,
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type EntityId,
} from "../../domain";
import type { AccessibilityPreferencesRepository } from "../repositories";

export type ResetAccessibilityPreferencesUseCaseInput = {
  userId: EntityId;
};

export class ResetAccessibilityPreferencesUseCase {
  constructor(
    private readonly accessibilityPreferencesRepository: AccessibilityPreferencesRepository,
  ) {}

  async execute(
    input: ResetAccessibilityPreferencesUseCaseInput,
  ): Promise<AccessibilityPreferences> {
    assertNonEmpty(input.userId, "ACCESSIBILITY_USER_ID_REQUIRED");

    return this.accessibilityPreferencesRepository.save(
      input.userId,
      defaultAccessibilityPreferences,
    );
  }
}
