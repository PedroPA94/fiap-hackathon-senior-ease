import type {
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

  async findById(id: EntityId): Promise<Activity | null> {
    return this.activities.get(id) ?? null;
  }

  async create(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);

    return activity;
  }

  async update(activity: Activity): Promise<Activity> {
    this.activities.set(activity.id, activity);

    return activity;
  }

  async delete(id: EntityId): Promise<void> {
    this.activities.delete(id);
  }
}
