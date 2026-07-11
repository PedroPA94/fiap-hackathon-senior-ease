import { Injectable } from '@angular/core';

import {
  createUserProfile,
  type EntityId,
  type UserProfile,
  type UserProfileRepository,
} from '@senior-ease/core';

@Injectable()
export class LocalStorageUserProfileRepository implements UserProfileRepository {
  async findById(id: EntityId): Promise<UserProfile | null> {
    const rawValue = localStorage.getItem(this.getStorageKey(id));

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as UserProfile;

      return createUserProfile(parsedValue);
    } catch {
      localStorage.removeItem(this.getStorageKey(id));

      return null;
    }
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    const normalizedProfile = createUserProfile(profile);

    localStorage.setItem(
      this.getStorageKey(normalizedProfile.id),
      JSON.stringify(normalizedProfile),
    );

    return normalizedProfile;
  }

  private getStorageKey(userId: EntityId): string {
    return `senior-ease:users:${userId}:profile`;
  }
}
