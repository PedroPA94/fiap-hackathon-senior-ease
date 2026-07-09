import type { EntityId, UserProfile } from "../../domain";

export interface UserProfileRepository {
  findById(id: EntityId): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
}
