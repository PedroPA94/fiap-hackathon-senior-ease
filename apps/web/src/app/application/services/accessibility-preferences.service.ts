import { Inject, Injectable } from '@angular/core';
import { defer, from, Observable } from 'rxjs';

import {
  GetAccessibilityPreferencesUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type EntityId,
} from '@senior-ease/core';

import { ACCESSIBILITY_PREFERENCES_REPOSITORY } from '../../core/tokens/repository.tokens';
import { UserSessionService } from './user-session.service';
import { UserSessionError } from '../errors/user-session.error';

@Injectable({ providedIn: 'root' })
export class AccessibilityPreferencesService {
  constructor(
    @Inject(ACCESSIBILITY_PREFERENCES_REPOSITORY)
    private readonly preferencesRepository: AccessibilityPreferencesRepository,

    private readonly userSessionService: UserSessionService,
  ) {}

  getPreferences(): Observable<AccessibilityPreferences> {
    return defer(() => {
      const useCase = new GetAccessibilityPreferencesUseCase(this.preferencesRepository);

      return from(useCase.execute({ userId: this.getRequiredCurrentUserId() }));
    });
  }

  updatePreferences(preferences: AccessibilityPreferences): Observable<AccessibilityPreferences> {
    return defer(() => {
      const useCase = new UpdateAccessibilityPreferencesUseCase(this.preferencesRepository);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          preferences,
        }),
      );
    });
  }

  resetPreferences(): Observable<AccessibilityPreferences> {
    return defer(() => {
      const useCase = new ResetAccessibilityPreferencesUseCase(this.preferencesRepository);

      return from(useCase.execute({ userId: this.getRequiredCurrentUserId() }));
    });
  }

  private getRequiredCurrentUserId(): EntityId {
    const userId = this.userSessionService.getCurrentUserId();

    if (!userId) {
      throw new UserSessionError('CURRENT_USER_REQUIRED');
    }

    return userId;
  }
}
