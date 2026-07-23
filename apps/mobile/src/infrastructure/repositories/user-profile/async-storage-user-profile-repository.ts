import {
  createUserProfile,
  type EntityId,
  type UserProfile,
  type UserProfileRepository,
} from "@senior-ease/core";

import type { Storage } from "../../storage";
import { StorageDataError, storageKeys } from "../../storage";

export class AsyncStorageUserProfileRepository
  implements UserProfileRepository
{
  constructor(private readonly storage: Storage) {}

  async findById(id: EntityId): Promise<UserProfile | null> {
    const key = storageKeys.userProfile(id);
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);
      const profile = parseUserProfile(parsedValue);

      if (profile.id !== id) {
        throw new TypeError("Stored profile has an unexpected identifier.");
      }

      return profile;
    } catch (error) {
      throw new StorageDataError(key, error);
    }
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    const parsedProfile = parseUserProfile(profile);
    const key = storageKeys.userProfile(parsedProfile.id);
    const storedProfile = await this.storage.getItem(key);

    if (storedProfile !== null) {
      throw new Error(`User profile "${parsedProfile.id}" already exists.`);
    }

    await this.storage.setItem(key, JSON.stringify(parsedProfile));

    return parsedProfile;
  }
}

function parseUserProfile(input: unknown): UserProfile {
  if (!isRecord(input)) {
    throw new TypeError("Stored user profile must be an object.");
  }

  const id = readString(input, "id");
  const name = readString(input, "name");
  const createdAt = readString(input, "createdAt");
  const updatedAt = readString(input, "updatedAt");

  return createUserProfile({ id, name, createdAt, updatedAt });
}

function readString(
  input: Record<string, unknown>,
  property: string,
): string {
  const value = input[property];

  if (typeof value !== "string") {
    throw new TypeError(`User profile property "${property}" must be a string.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
