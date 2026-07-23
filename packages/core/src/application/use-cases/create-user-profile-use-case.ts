import {
  createUserProfile,
  type EntityId,
  type UserProfile,
} from "../../domain/index.js";
import type { UserProfileRepository } from "../repositories/index.js";
import type { Clock } from "../services/index.js";

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
