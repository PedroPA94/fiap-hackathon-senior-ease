import { Inject, Injectable } from '@angular/core';

import {
  ApplicationError,
  CreateUserProfileUseCase,
  GetUserProfileUseCase,
  type Clock,
  type EntityId,
  type IdGenerator,
  type UserProfile,
  type UserProfileRepository,
} from '@senior-ease/core';

import { USER_PROFILE_REPOSITORY } from '../../core/tokens/repository.tokens';
import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import type { LocalUser } from '../models/local-user';
import { storageKeys } from '../../core/constants/storage-keys';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: UserProfileRepository,

    @Inject(CLOCK)
    private readonly clock: Clock,

    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  getCurrentUserId(): EntityId | null {
    return localStorage.getItem(storageKeys.currentUserId);
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const currentUserId = this.getCurrentUserId();

    if (!currentUserId) {
      return null;
    }

    const useCase = new GetUserProfileUseCase(this.userProfileRepository);

    try {
      return await useCase.execute({ id: currentUserId });
    } catch (error) {
      if (error instanceof ApplicationError && error.code === 'USER_PROFILE_NOT_FOUND') {
        this.clearCurrentUser();

        return null;
      }

      throw error;
    }
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

      return parsedValue.filter(this.isLocalUserSummary);
    } catch {
      localStorage.removeItem(storageKeys.userIndex);

      return [];
    }
  }

  async createLocalUser(name: string): Promise<UserProfile> {
    const now = this.clock.now();
    const id = this.idGenerator.generate();

    const useCase = new CreateUserProfileUseCase(this.userProfileRepository, this.clock);

    const profile = await useCase.execute({
      id,
      name,
    });

    this.setCurrentUser(profile.id);
    this.saveLocalUser({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: now,
    });

    return profile;
  }

  async selectLocalUser(userId: EntityId): Promise<UserProfile> {
    const useCase = new GetUserProfileUseCase(this.userProfileRepository);
    const profile = await useCase.execute({ id: userId });

    this.setCurrentUser(profile.id);
    this.saveLocalUser({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: this.clock.now(),
    });

    return profile;
  }

  clearCurrentUser(): void {
    localStorage.removeItem(storageKeys.currentUserId);
  }

  private setCurrentUser(userId: EntityId): void {
    localStorage.setItem(storageKeys.currentUserId, userId);
  }

  private saveLocalUser(user: LocalUser): void {
    const users = this.listLocalUsers();
    const usersWithoutCurrent = users.filter((item) => item.id !== user.id);

    const updatedUsers = [user, ...usersWithoutCurrent].sort((a, b) =>
      b.lastAccessedAt.localeCompare(a.lastAccessedAt),
    );

    localStorage.setItem(storageKeys.userIndex, JSON.stringify(updatedUsers));
  }

  private isLocalUserSummary(value: unknown): value is LocalUser {
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
