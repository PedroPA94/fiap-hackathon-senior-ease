import type {
  AccessibilityPreferences,
  EntityId,
  UserProfile,
} from "../../domain/index.js";
import { ApplicationError } from "../errors/index.js";
import type {
  AccessibilityPreferencesRepository,
  UserProfileRepository,
} from "../repositories/index.js";
import { defaultAccessibilityPreferences, assertNonEmpty } from "../../domain/index.js";

export type UserExperienceProfile = {
  profile: UserProfile;
  accessibilityPreferences: AccessibilityPreferences;
};

export type GetUserExperienceProfileUseCaseInput = {
  userId: EntityId;
};

export class GetUserExperienceProfileUseCase {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly accessibilityPreferencesRepository: AccessibilityPreferencesRepository,
  ) {}

  async execute(
    input: GetUserExperienceProfileUseCaseInput,
  ): Promise<UserExperienceProfile> {
    assertNonEmpty(input.userId, "USER_PROFILE_ID_REQUIRED");

    const profile = await this.userProfileRepository.findById(input.userId);

    if (!profile) {
      throw new ApplicationError("USER_PROFILE_NOT_FOUND");
    }

    const accessibilityPreferences =
      await this.accessibilityPreferencesRepository.findByUserId(input.userId);

    return {
      profile,
      accessibilityPreferences:
        accessibilityPreferences ?? defaultAccessibilityPreferences,
    };
  }
}
