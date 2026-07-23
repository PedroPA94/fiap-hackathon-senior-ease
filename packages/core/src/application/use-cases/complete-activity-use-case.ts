import {
  assertNonEmpty,
  completeActivity,
  type Activity,
  type EntityId,
} from "../../domain/index.js";
import { ApplicationError } from "../errors/index.js";
import type { ActivityRepository } from "../repositories/index.js";
import type { Clock } from "../services/index.js";

export type CompleteActivityUseCaseInput = {
  activityId: EntityId;
  userId: EntityId;
};

export class CompleteActivityUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CompleteActivityUseCaseInput): Promise<Activity> {
    assertNonEmpty(input.userId, "ACTIVITY_USER_ID_REQUIRED");
    assertNonEmpty(input.activityId, "ACTIVITY_ID_REQUIRED");

    const activity = await this.activityRepository.findById({
      activityId: input.activityId,
      userId: input.userId,
    });

    if (!activity || activity.userId !== input.userId) {
      throw new ApplicationError("ACTIVITY_NOT_FOUND");
    }

    const completedAt = this.clock.now();

    const updatedActivity = completeActivity(activity, completedAt);

    return this.activityRepository.update(updatedActivity);
  }
}
