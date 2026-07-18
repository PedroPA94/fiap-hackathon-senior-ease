import type { Activity, EntityId } from "../../domain";

import {
  assertPositiveInteger,
  resolveActivityStatus,
  sortActivitySteps,
} from "../../domain";
import { ApplicationError } from "../errors";

import type { ActivityRepository } from "../repositories";

const DEFAULT_LIMIT = 5;

export type ListRecentCompletedActivitiesByUserUseCaseInput = {
  userId: EntityId;
  limit?: number;
};

export class ListRecentCompletedActivitiesByUserUseCase {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async execute(
    input: ListRecentCompletedActivitiesByUserUseCaseInput,
  ): Promise<Activity[]> {
    const activities = await this.activityRepository.list({
      userId: input.userId,
    });

    const limit = input.limit ?? DEFAULT_LIMIT;

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ApplicationError("ACTIVITY_RECENT_LIMIT_INVALID");
    }

    return activities
      .filter((activity) => resolveActivityStatus(activity) === "completed")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((activity) => ({
        ...activity,
        steps: sortActivitySteps(activity.steps),
      }));
  }
}
