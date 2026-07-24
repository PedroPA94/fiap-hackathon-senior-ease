import { inject, Injectable } from '@angular/core';
import { catchError, defer, from, of, tap, throwError, type Observable } from 'rxjs';

import {
  ApplicationError,
  CreateUserProfileUseCase,
  GetUserProfileUseCase,
  type EntityId,
  type UserProfile,
} from '@senior-ease/core';

import { USER_PROFILE_REPOSITORY } from '../../core/tokens/repository.tokens';
import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import { LocalStorageUserSessionStore } from '../../infrastructure/stores/local-storage-user-session.store';
import { UserSessionError } from '../errors/user-session.error';
import type { LocalUser } from '../models/local-user';
import { DismissedRemindersService } from './dismissed-reminders.service';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly userProfileRepository = inject(USER_PROFILE_REPOSITORY);
  private readonly clock = inject(CLOCK);
  private readonly idGenerator = inject(ID_GENERATOR);
  private readonly userSessionStore = inject(LocalStorageUserSessionStore);
  private readonly dismissedRemindersService = inject(DismissedRemindersService);

  getCurrentUserId(): EntityId | null {
    return this.userSessionStore.getCurrentUserId();
  }

  hasCompletedOnboarding(userId?: EntityId): boolean {
    const resolvedUserId = userId ?? this.getCurrentUserId();

    return resolvedUserId ? this.userSessionStore.hasCompletedOnboarding(resolvedUserId) : false;
  }

  markOnboardingCompleted(): void {
    const currentUserId = this.getCurrentUserId();

    if (!currentUserId) {
      throw new UserSessionError('CURRENT_USER_REQUIRED');
    }

    this.userSessionStore.markOnboardingCompleted(currentUserId);
  }

  getInitialRouteForUser(userId?: EntityId): '/home' | '/personalization/setup' {
    return this.hasCompletedOnboarding(userId) ? '/home' : '/personalization/setup';
  }

  getCurrentUserProfile(): Observable<UserProfile | null> {
    return defer(() => {
      const currentUserId = this.getCurrentUserId();

      if (!currentUserId) {
        return of(null);
      }

      const useCase = new GetUserProfileUseCase(this.userProfileRepository);

      return from(useCase.execute({ id: currentUserId })).pipe(
        catchError((error: unknown) => {
          if (error instanceof ApplicationError && error.code === 'USER_PROFILE_NOT_FOUND') {
            this.clearCurrentUser();

            return of(null);
          }

          return throwError(() => error);
        }),
      );
    });
  }

  listLocalUsers(): LocalUser[] {
    return this.userSessionStore.listLocalUsers();
  }

  createLocalUser(name: string): Observable<UserProfile> {
    return defer(() => {
      const now = this.clock.now();
      const id = this.idGenerator.generate();

      const useCase = new CreateUserProfileUseCase(this.userProfileRepository, this.clock);

      return from(
        useCase.execute({
          id,
          name,
        }),
      ).pipe(
        tap((profile) => {
          this.setCurrentUser(profile.id);

          this.userSessionStore.saveLocalUser({
            id: profile.id,
            name: profile.name,
            lastAccessedAt: now,
          });
        }),
      );
    });
  }

  selectLocalUser(userId: EntityId): Observable<UserProfile> {
    return defer(() => {
      const useCase = new GetUserProfileUseCase(this.userProfileRepository);

      return from(useCase.execute({ id: userId })).pipe(
        tap((profile) => {
          this.setCurrentUser(profile.id);

          this.userSessionStore.saveLocalUser({
            id: profile.id,
            name: profile.name,
            lastAccessedAt: this.clock.now(),
          });
        }),
      );
    });
  }

  clearCurrentUser(): void {
    this.dismissedRemindersService.clear();
    this.userSessionStore.clearCurrentUserId();
  }

  private setCurrentUser(userId: EntityId): void {
    if (this.getCurrentUserId() !== userId) {
      this.dismissedRemindersService.clear();
    }

    this.userSessionStore.setCurrentUserId(userId);
  }
}
