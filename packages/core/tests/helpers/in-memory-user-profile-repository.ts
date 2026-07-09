import type { UserProfileRepository } from "../../src/application";
import type { EntityId, UserProfile } from "../../src/domain";

export class InMemoryUserProfileRepository implements UserProfileRepository {
  readonly profiles = new Map<EntityId, UserProfile>();

  async findById(id: EntityId): Promise<UserProfile | null> {
    return this.profiles.get(id) ?? null;
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    this.profiles.set(profile.id, profile);

    return profile;
  }
}
