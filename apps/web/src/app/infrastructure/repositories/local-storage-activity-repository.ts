import { Injectable } from '@angular/core';

import {
  ApplicationError,
  parseActivity,
  sortActivitySteps,
  type Activity,
  type ActivityIdentity,
  type ActivityQuery,
  type ActivityRepository,
  type EntityId,
} from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';

@Injectable()
export class LocalStorageActivityRepository implements ActivityRepository {
  async list(query: ActivityQuery): Promise<Activity[]> {
    return this.readActivities(query.userId)
      .filter((activity) => {
        return query.date === undefined || activity.date === query.date;
      })
      .map((activity) => this.cloneActivity(activity));
  }

  async findById(identity: ActivityIdentity): Promise<Activity | null> {
    const activity = this.readActivities(identity.userId).find(
      (item) => item.id === identity.activityId && item.userId === identity.userId,
    );

    return activity ? this.cloneActivity(activity) : null;
  }

  async create(activity: Activity): Promise<Activity> {
    const parsedActivity = parseActivity(activity);
    const activities = this.readActivities(parsedActivity.userId);

    const alreadyExists = activities.some((item) => item.id === parsedActivity.id);

    if (alreadyExists) {
      throw new ApplicationError('ACTIVITY_ALREADY_EXISTS');
    }

    const activityToPersist = this.cloneActivity(parsedActivity);

    this.writeActivities(parsedActivity.userId, [...activities, activityToPersist]);

    return this.cloneActivity(activityToPersist);
  }

  async update(activity: Activity): Promise<Activity> {
    const parsedActivity = parseActivity(activity);
    const activities = this.readActivities(parsedActivity.userId);

    const activityIndex = activities.findIndex((item) => item.id === parsedActivity.id);

    if (activityIndex < 0) {
      throw new ApplicationError('ACTIVITY_NOT_FOUND');
    }

    const updatedActivities = [...activities];

    updatedActivities[activityIndex] = this.cloneActivity(parsedActivity);

    this.writeActivities(parsedActivity.userId, updatedActivities);

    return this.cloneActivity(parsedActivity);
  }

  async delete(identity: ActivityIdentity): Promise<void> {
    const activities = this.readActivities(identity.userId);

    const remainingActivities = activities.filter(
      (activity) => activity.id !== identity.activityId || activity.userId !== identity.userId,
    );

    if (remainingActivities.length === activities.length) {
      return;
    }

    this.writeActivities(identity.userId, remainingActivities);
  }

  private readActivities(userId: EntityId): Activity[] {
    const storageKey = storageKeys.activities(userId);
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        localStorage.removeItem(storageKey);
        return [];
      }

      const validActivities: Activity[] = [];

      for (const value of parsedValue) {
        try {
          const activity = parseActivity(value);

          if (activity.userId !== userId) {
            continue;
          }

          validActivities.push(this.cloneActivity(activity));
        } catch {
          // Descarta somente o registro inválido.
        }
      }

      if (validActivities.length !== parsedValue.length) {
        this.writeActivities(userId, validActivities);
      }

      return validActivities;
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }

  private writeActivities(userId: EntityId, activities: Activity[]): void {
    localStorage.setItem(storageKeys.activities(userId), JSON.stringify(activities));
  }

  private cloneActivity(activity: Activity): Activity {
    return {
      ...activity,
      steps: sortActivitySteps(activity.steps.map((step) => ({ ...step }))),
    };
  }
}
