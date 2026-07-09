import { assertNonEmpty, type EntityId, type UserProfile } from "../../domain";
import { ApplicationError } from "../errors";
import type { UserProfileRepository } from "../repositories";

export type GetUserProfileUseCaseInput = {
  id: EntityId;
};

export class GetUserProfileUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(input: GetUserProfileUseCaseInput): Promise<UserProfile> {
    assertNonEmpty(input.id, "USER_PROFILE_ID_REQUIRED");

    const profile = await this.userProfileRepository.findById(input.id);

    if (!profile) {
      throw new ApplicationError("USER_PROFILE_NOT_FOUND");
    }

    return profile;
  }
}
