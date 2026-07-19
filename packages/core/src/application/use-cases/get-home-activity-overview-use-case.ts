import {
  assertNonEmpty,
  resolveActivityStatus,
  sortActivitySteps,
  type Activity,
  type ActivityStatus,
  type DateOnlyString,
  type EntityId,
} from "../../domain";
import { ApplicationError } from "../errors";
import type { ActivityRepository } from "../repositories";
import type { Clock } from "../services";

const DEFAULT_RECENT_ACTIVITIES_LIMIT = 2;

export type TodayActivitySummary = {
  pending: number;
  inProgress: number;
  completed: number;
};

export type HomeActivityOverview = {
  nextActivity: Activity | null;
  recentCompletedActivities: Activity[];
  todaySummary: TodayActivitySummary;
};

export type GetHomeActivityOverviewUseCaseInput = {
  userId: EntityId;
  recentActivitiesLimit?: number;
};

export class GetHomeActivityOverviewUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetHomeActivityOverviewUseCaseInput,
  ): Promise<HomeActivityOverview> {
    assertNonEmpty(input.userId, "ACTIVITY_USER_ID_REQUIRED");

    const recentActivitiesLimit =
      input.recentActivitiesLimit ?? DEFAULT_RECENT_ACTIVITIES_LIMIT;

    if (
      !Number.isInteger(recentActivitiesLimit) ||
      recentActivitiesLimit <= 0
    ) {
      throw new ApplicationError("ACTIVITY_RECENT_LIMIT_INVALID");
    }

    const today = this.clock.today();
    const activities = await this.activityRepository.list({
      userId: input.userId,
    });

    return {
      nextActivity: selectNextActivity(activities, today),
      recentCompletedActivities: selectRecentCompletedActivities(
        activities,
        recentActivitiesLimit,
      ),
      todaySummary: summarizeTodayActivities(activities, today),
    };
  }
}

function selectNextActivity(
  activities: Activity[],
  today: DateOnlyString,
): Activity | null {
  const nextActivity = activities
    .filter((activity) => resolveActivityStatus(activity) !== "completed")
    .sort((first, second) => compareNextActivities(first, second, today))[0];

  return nextActivity ? cloneWithSortedSteps(nextActivity) : null;
}

function compareNextActivities(
  first: Activity,
  second: Activity,
  today: DateOnlyString,
): number {
  const groupComparison =
    getDateGroup(first.date, today) - getDateGroup(second.date, today);

  if (groupComparison !== 0) {
    return groupComparison;
  }

  const dateComparison = first.date.localeCompare(second.date);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const timeComparison = compareOptionalTimes(first.time, second.time);

  if (timeComparison !== 0) {
    return timeComparison;
  }

  const creationComparison = first.createdAt.localeCompare(second.createdAt);

  return creationComparison !== 0
    ? creationComparison
    : first.id.localeCompare(second.id);
}

function getDateGroup(date: DateOnlyString, today: DateOnlyString): number {
  if (date < today) {
    return 0;
  }

  return date === today ? 1 : 2;
}

function compareOptionalTimes(
  first: Activity["time"],
  second: Activity["time"],
): number {
  if (first && second) {
    return first.localeCompare(second);
  }

  if (first) {
    return -1;
  }

  return second ? 1 : 0;
}

function selectRecentCompletedActivities(
  activities: Activity[],
  limit: number,
): Activity[] {
  return activities
    .filter((activity) => resolveActivityStatus(activity) === "completed")
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    .slice(0, limit)
    .map(cloneWithSortedSteps);
}

function summarizeTodayActivities(
  activities: Activity[],
  today: DateOnlyString,
): TodayActivitySummary {
  const summary: TodayActivitySummary = {
    pending: 0,
    inProgress: 0,
    completed: 0,
  };

  return activities
    .filter((activity) => activity.date === today)
    .reduce((currentSummary, activity) => {
      const status: ActivityStatus = resolveActivityStatus(activity);

      return {
        ...currentSummary,
        [status]: currentSummary[status] + 1,
      };
    }, summary);
}

function cloneWithSortedSteps(activity: Activity): Activity {
  return {
    ...activity,
    steps: sortActivitySteps(activity.steps),
  };
}
