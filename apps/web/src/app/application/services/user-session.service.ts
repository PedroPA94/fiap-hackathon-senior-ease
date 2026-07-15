import { Inject, Injectable } from '@angular/core';
import { catchError, defer, from, Observable, of, tap, throwError } from 'rxjs';

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
import { LocalStorageUserSessionStore } from '../../infrastructure/stores/local-storage-user-session.store';
import type { LocalUser } from '../models/local-user';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: UserProfileRepository,

    @Inject(CLOCK)
    private readonly clock: Clock,

    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,

    private readonly userSessionStore: LocalStorageUserSessionStore,
  ) {}

  getCurrentUserId(): EntityId | null {
    return this.userSessionStore.getCurrentUserId();
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
          this.userSessionStore.setCurrentUserId(profile.id);

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
          this.userSessionStore.setCurrentUserId(profile.id);

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
    this.userSessionStore.clearCurrentUserId();
  }
}
