import {
  assertNonEmpty,
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type EntityId,
} from "../../domain";
import type { AccessibilityPreferencesRepository } from "../repositories";

export type GetAccessibilityPreferencesUseCaseInput = {
  userId: EntityId;
};

export class GetAccessibilityPreferencesUseCase {
  constructor(
    private readonly accessibilityPreferencesRepository: AccessibilityPreferencesRepository,
  ) {}

  async execute(
    input: GetAccessibilityPreferencesUseCaseInput,
  ): Promise<AccessibilityPreferences> {
    assertNonEmpty(input.userId, "ACCESSIBILITY_USER_ID_REQUIRED");

    const preferences =
      await this.accessibilityPreferencesRepository.findByUserId(input.userId);

    return preferences ?? defaultAccessibilityPreferences;
  }
}
