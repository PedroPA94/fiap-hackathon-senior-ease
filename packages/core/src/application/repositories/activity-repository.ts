import type { Activity, DateOnlyString, EntityId } from "../../domain";

export type ActivityQuery = {
  userId: EntityId;
  date?: DateOnlyString;
};

export interface ActivityRepository {
  list(query: ActivityQuery): Promise<Activity[]>;

  findById(id: EntityId): Promise<Activity | null>;

  create(activity: Activity): Promise<Activity>;

  update(activity: Activity): Promise<Activity>;

  delete(id: EntityId): Promise<void>;
}
