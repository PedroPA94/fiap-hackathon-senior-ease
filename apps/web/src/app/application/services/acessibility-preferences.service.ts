import { Inject, Injectable } from '@angular/core';

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

  async getPreferences(): Promise<AccessibilityPreferences> {
    const useCase = new GetAccessibilityPreferencesUseCase(this.preferencesRepository);

    return useCase.execute({ userId: this.getRequiredCurrentUserId() });
  }

  async updatePreferences(
    preferences: AccessibilityPreferences,
  ): Promise<AccessibilityPreferences> {
    const useCase = new UpdateAccessibilityPreferencesUseCase(this.preferencesRepository);

    return useCase.execute({
      userId: this.getRequiredCurrentUserId(),
      preferences,
    });
  }

  async resetPreferences(): Promise<AccessibilityPreferences> {
    const useCase = new ResetAccessibilityPreferencesUseCase(this.preferencesRepository);

    return useCase.execute({ userId: this.getRequiredCurrentUserId() });
  }

  private getRequiredCurrentUserId(): EntityId {
    const userId = this.userSessionService.getCurrentUserId();

    if (!userId) {
      throw new UserSessionError('CURRENT_USER_REQUIRED');
    }

    return userId;
  }
}
