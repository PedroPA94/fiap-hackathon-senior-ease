import { assertNonEmpty, type Activity, type EntityId } from "../../domain/index.js";
import { ApplicationError } from "../errors/index.js";
import type { ActivityRepository } from "../repositories/index.js";

export type GetActivityByIdUseCaseInput = {
  userId: EntityId;
  activityId: EntityId;
};

export class GetActivityByIdUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(input: GetActivityByIdUseCaseInput): Promise<Activity> {
    assertNonEmpty(input.userId, "ACTIVITY_USER_ID_REQUIRED");
    assertNonEmpty(input.activityId, "ACTIVITY_ID_REQUIRED");

    const activity = await this.activityRepository.findById({
      userId: input.userId,
      activityId: input.activityId,
    });

    if (!activity || activity.userId !== input.userId) {
      throw new ApplicationError("ACTIVITY_NOT_FOUND");
    }

    return activity;
  }
}
