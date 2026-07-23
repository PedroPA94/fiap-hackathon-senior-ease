import {
  resolveActivityStatus,
  sortActivitySteps,
  type Activity,
  type ActivityStatus,
  type EntityId,
} from "../../domain/index.js";
import type { ActivityRepository } from "../repositories/index.js";
import type { Clock } from "../services/index.js";

export type ActivityListFilter = "all" | "today" | ActivityStatus;

export type ListActivitiesByUserUseCaseInput = {
  userId: EntityId;
  filter?: ActivityListFilter;
};

export class ListActivitiesByUserUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ListActivitiesByUserUseCaseInput): Promise<Activity[]> {
    const activities = await this.activityRepository.list({
      userId: input.userId,
      date: input.filter === "today" ? this.clock.today() : undefined,
    });

    const filteredActivities = activities.filter((activity) => {
      if (!input.filter || input.filter === "all" || input.filter === "today") {
        return true;
      }

      return resolveActivityStatus(activity) === input.filter;
    });

    return filteredActivities.map((activity) => ({
      ...activity,
      steps: sortActivitySteps(activity.steps),
    }));
  }
}
