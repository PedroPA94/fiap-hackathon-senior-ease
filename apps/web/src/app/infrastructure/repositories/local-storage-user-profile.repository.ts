import { Injectable } from '@angular/core';

import {
  createUserProfile,
  type EntityId,
  type UserProfile,
  type UserProfileRepository,
} from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';

@Injectable()
export class LocalStorageUserProfileRepository implements UserProfileRepository {
  async findById(id: EntityId): Promise<UserProfile | null> {
    const rawValue = localStorage.getItem(storageKeys.userProfile(id));

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as UserProfile;

      return createUserProfile(parsedValue);
    } catch {
      localStorage.removeItem(storageKeys.userProfile(id));

      return null;
    }
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    const normalizedProfile = createUserProfile(profile);

    localStorage.setItem(
      storageKeys.userProfile(normalizedProfile.id),
      JSON.stringify(normalizedProfile),
    );

    return normalizedProfile;
  }
}
