import type { EntityId, UserProfile } from "../../domain/index.js";

export interface UserProfileRepository {
  findById(id: EntityId): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
}
