import type {
  ActivityIdentity,
  ActivityQuery,
  ActivityRepository,
} from "../../src/application";
import type { Activity, EntityId } from "../../src/domain";

export class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<EntityId, Activity>();

  async list(query: ActivityQuery): Promise<Activity[]> {
    return [...this.activities.values()].filter((activity) => {
      if (activity.userId !== query.userId) {
        return false;
      }

      return query.date === undefined || activity.date === query.date;
    });
  }

  async findById(identity: ActivityIdentity): Promise<Activity | null> {
    const activity = this.activities.get(identity.activityId);

    if (!activity || activity.userId !== identity.userId) {
      return null;
    }

    return activity;
  }

  async create(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);

    return activity;
  }

  async update(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);

    return activity;
  }

  async delete(identity: ActivityIdentity): Promise<void> {
    const activity = this.activities.get(identity.activityId);

    if (activity?.userId === identity.userId) {
      this.activities.delete(identity.activityId);
    }
  }
}
