import { assertNonEmpty, type EntityId } from "../../domain/index.js";
import type { ActivityRepository } from "../repositories/index.js";

export type DeleteActivityUseCaseInput = {
  userId: EntityId;
  activityId: EntityId;
};

export class DeleteActivityUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(input: DeleteActivityUseCaseInput): Promise<void> {
    assertNonEmpty(input.userId, "ACTIVITY_USER_ID_REQUIRED");
    assertNonEmpty(input.activityId, "ACTIVITY_ID_REQUIRED");

    await this.activityRepository.delete({
      userId: input.userId,
      activityId: input.activityId,
    });
  }
}
