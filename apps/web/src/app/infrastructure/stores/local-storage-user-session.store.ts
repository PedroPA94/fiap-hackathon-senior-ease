import { Injectable } from '@angular/core';

import type { EntityId } from '@senior-ease/core';

import type { LocalUser } from '../../application/models/local-user';
import { storageKeys } from '../../core/constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class LocalStorageUserSessionStore {
  getCurrentUserId(): EntityId | null {
    return localStorage.getItem(storageKeys.currentUserId);
  }

  setCurrentUserId(userId: EntityId): void {
    localStorage.setItem(storageKeys.currentUserId, userId);
  }

  clearCurrentUserId(): void {
    localStorage.removeItem(storageKeys.currentUserId);
  }

  listLocalUsers(): LocalUser[] {
    const rawValue = localStorage.getItem(storageKeys.userIndex);

    if (!rawValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        localStorage.removeItem(storageKeys.userIndex);
        return [];
      }

      return parsedValue.filter(this.isLocalUser);
    } catch {
      localStorage.removeItem(storageKeys.userIndex);
      return [];
    }
  }

  saveLocalUser(user: LocalUser): void {
    const users = this.listLocalUsers();
    const usersWithoutCurrent = users.filter((item) => item.id !== user.id);

    const updatedUsers = [user, ...usersWithoutCurrent].sort((a, b) =>
      b.lastAccessedAt.localeCompare(a.lastAccessedAt),
    );

    localStorage.setItem(storageKeys.userIndex, JSON.stringify(updatedUsers));
  }

  private isLocalUser(value: unknown): value is LocalUser {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<LocalUser>;

    return (
      typeof candidate.id === 'string' &&
      candidate.id.trim().length > 0 &&
      typeof candidate.name === 'string' &&
      candidate.name.trim().length > 0 &&
      typeof candidate.lastAccessedAt === 'string' &&
      candidate.lastAccessedAt.trim().length > 0
    );
  }
}