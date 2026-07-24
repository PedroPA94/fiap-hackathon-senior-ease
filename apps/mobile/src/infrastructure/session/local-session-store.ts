import type { EntityId, ISODateTimeString } from "@senior-ease/core";

import type {
  ApplicationSessionStore,
  LocalUserSummary,
} from "../../application/session";
import type { Storage } from "../storage";
import { storageKeys } from "../storage";

export class LocalSessionStore implements ApplicationSessionStore {
  constructor(private readonly storage: Storage) {}

  async getCurrentUserId(): Promise<EntityId | null> {
    const key = storageKeys.currentUserId;
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);

      if (!isNonEmptyString(parsedValue)) {
        throw new TypeError("Current user identifier must be a string.");
      }

      return parsedValue;
    } catch {
      await this.storage.removeItem(key);

      return null;
    }
  }

  async setCurrentUserId(userId: EntityId): Promise<void> {
    if (!isNonEmptyString(userId)) {
      throw new TypeError("Current user identifier must not be empty.");
    }

    await this.storage.setItem(
      storageKeys.currentUserId,
      JSON.stringify(userId),
    );
  }

  async clearCurrentUserId(): Promise<void> {
    await this.storage.removeItem(storageKeys.currentUserId);
  }

  async listUsers(): Promise<readonly LocalUserSummary[]> {
    const key = storageKeys.userIndex;
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return [];
    }

    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      await this.storage.removeItem(key);

      return [];
    }

    if (!Array.isArray(parsedValue)) {
      await this.storage.removeItem(key);

      return [];
    }

    const users = sanitizeUsers(parsedValue);
    const serializedUsers = JSON.stringify(users);

    if (serializedUsers !== rawValue) {
      await this.storage.setItem(key, serializedUsers);
    }

    return cloneUsers(users);
  }

  async upsertUser(user: LocalUserSummary): Promise<void> {
    const parsedUser = parseLocalUserSummary(user);

    if (!parsedUser) {
      throw new TypeError("Local user summary is invalid.");
    }

    const users = await this.listUsers();
    const updatedUsers = sortUsers([
      parsedUser,
      ...users.filter((candidate) => candidate.id !== parsedUser.id),
    ]);

    await this.storage.setItem(
      storageKeys.userIndex,
      JSON.stringify(updatedUsers),
    );
  }

  async removeUser(userId: EntityId): Promise<void> {
    const users = await this.listUsers();
    const remainingUsers = users.filter((user) => user.id !== userId);

    if (remainingUsers.length === users.length) {
      return;
    }

    if (remainingUsers.length === 0) {
      await this.storage.removeItem(storageKeys.userIndex);

      return;
    }

    await this.storage.setItem(
      storageKeys.userIndex,
      JSON.stringify(remainingUsers),
    );
  }

  async isOnboardingCompleted(userId: EntityId): Promise<boolean> {
    const key = storageKeys.onboardingCompleted(userId);
    const rawValue = await this.storage.getItem(key);

    if (rawValue === null) {
      return false;
    }

    try {
      const parsedValue: unknown = JSON.parse(rawValue);

      if (parsedValue === true) {
        return true;
      }
    } catch {
      // The invalid marker is removed below.
    }

    await this.storage.removeItem(key);

    return false;
  }

  async markOnboardingCompleted(userId: EntityId): Promise<void> {
    if (!isNonEmptyString(userId)) {
      throw new TypeError("Onboarding user identifier must not be empty.");
    }

    await this.storage.setItem(
      storageKeys.onboardingCompleted(userId),
      JSON.stringify(true),
    );
  }
}

function sanitizeUsers(input: readonly unknown[]): LocalUserSummary[] {
  const userIds = new Set<EntityId>();
  const users: LocalUserSummary[] = [];

  for (const value of input) {
    const user = parseLocalUserSummary(value);

    if (!user || userIds.has(user.id)) {
      continue;
    }

    userIds.add(user.id);
    users.push(user);
  }

  return sortUsers(users);
}

function parseLocalUserSummary(input: unknown): LocalUserSummary | null {
  if (!isRecord(input)) {
    return null;
  }

  const { id, name, lastAccessedAt } = input;

  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(name) ||
    !isISODateTimeString(lastAccessedAt)
  ) {
    return null;
  }

  return {
    id,
    name,
    lastAccessedAt,
  };
}

function sortUsers(users: readonly LocalUserSummary[]): LocalUserSummary[] {
  return [...users].sort(
    (first, second) =>
      second.lastAccessedAt.localeCompare(first.lastAccessedAt) ||
      first.id.localeCompare(second.id),
  );
}

function cloneUsers(users: readonly LocalUserSummary[]): LocalUserSummary[] {
  return users.map((user) => ({ ...user }));
}

function isISODateTimeString(value: unknown): value is ISODateTimeString {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
