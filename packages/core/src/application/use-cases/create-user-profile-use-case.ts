import {
  createUserProfile,
  type EntityId,
  type UserProfile,
} from "../../domain";
import type { UserProfileRepository } from "../repositories";
import type { Clock } from "../services";

export type CreateUserProfileUseCaseInput = {
  id: EntityId;
  name: string;
};

export class CreateUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateUserProfileUseCaseInput): Promise<UserProfile> {
    const now = this.clock.now();

    const profile = createUserProfile({
      id: input.id,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });

    return this.userProfileRepository.create(profile);
  }
}
