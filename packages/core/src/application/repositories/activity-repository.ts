import type { Activity, DateOnlyString, EntityId } from "../../domain/index.js";

export type ActivityQuery = {
  userId: EntityId;
  date?: DateOnlyString;
};

export type ActivityIdentity = {
  userId: EntityId;
  activityId: EntityId;
};

export interface ActivityRepository {
  list(query: ActivityQuery): Promise<Activity[]>;
  findById(identity: ActivityIdentity): Promise<Activity | null>;
  create(activity: Activity): Promise<Activity>;
  update(activity: Activity): Promise<Activity>;
  delete(identity: ActivityIdentity): Promise<void>;
}
