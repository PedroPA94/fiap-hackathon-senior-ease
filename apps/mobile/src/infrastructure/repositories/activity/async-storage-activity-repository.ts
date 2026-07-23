import {
  ApplicationError,
  parseActivity,
  type Activity,
  type ActivityIdentity,
  type ActivityQuery,
  type ActivityRepository,
  type EntityId,
} from "@senior-ease/core";

import type { Storage } from "../../storage";
import { StorageDataError, storageKeys } from "../../storage";

export class AsyncStorageActivityRepository implements ActivityRepository {
  constructor(private readonly storage: Storage) {}

  async list(query: ActivityQuery): Promise<Activity[]> {
    const activities = await this.readActivities(query.userId);

    return activities.filter(
      (activity) => query.date === undefined || activity.date === query.date,
    );
  }

  async findById(identity: ActivityIdentity): Promise<Activity | null> {
    const activities = await this.readActivities(identity.userId);

    return (
      activities.find((activity) => activity.id === identity.activityId) ?? null
    );
  }

  async create(activity: Activity): Promise<Activity> {
    const parsedActivity = parseActivity(activity);
    const activities = await this.readActivities(parsedActivity.userId);

    if (activities.some((item) => item.id === parsedActivity.id)) {
      throw new ApplicationError("ACTIVITY_ALREADY_EXISTS");
    }

    await this.writeActivities(parsedActivity.userId, [
      ...activities,
      parsedActivity,
    ]);

    return parsedActivity;
  }

  async update(activity: Activity): Promise<Activity> {
    const parsedActivity = parseActivity(activity);
    const activities = await this.readActivities(parsedActivity.userId);
    const activityIndex = activities.findIndex(
      (item) => item.id === parsedActivity.id,
    );

    if (activityIndex < 0) {
      throw new ApplicationError("ACTIVITY_NOT_FOUND");
    }

    const updatedActivities = [...activities];
    updatedActivities[activityIndex] = parsedActivity;

    await this.writeActivities(parsedActivity.userId, updatedActivities);

    return parsedActivity;
  }

  async delete(identity: ActivityIdentity): Promise<void> {
    const activities = await this.readActivities(identity.userId);
    const remainingActivities = activities.filter(
      (activity) => activity.id !== identity.activityId,
    );

    if (remainingActivities.length === activities.length) {
      return;
    }

    const key = storageKeys.activities(identity.userId);

    if (remainingActivities.length === 0) {
      await this.storage.removeItem(key);
      return;
    }

    await this.storage.setItem(key, JSON.stringify(remainingActivities));
  }

  private async readActivities(userId: EntityId): Promise<Activity[]> {
    const key = storageKeys.activities(userId);
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return [];
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        throw new TypeError("Stored activities must be an array.");
      }

      return parsedValue.map((value) => {
        const activity = parseActivity(value);

        if (activity.userId !== userId) {
          throw new TypeError("Stored activity belongs to another user.");
        }

        return activity;
      });
    } catch (error) {
      throw new StorageDataError(key, error);
    }
  }

  private async writeActivities(
    userId: EntityId,
    activities: Activity[],
  ): Promise<void> {
    await this.storage.setItem(
      storageKeys.activities(userId),
      JSON.stringify(activities),
    );
  }
}
