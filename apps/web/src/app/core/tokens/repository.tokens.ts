import { InjectionToken } from '@angular/core';

import type { AccessibilityPreferencesRepository, UserProfileRepository } from '@senior-ease/core';

export const ACCESSIBILITY_PREFERENCES_REPOSITORY =
  new InjectionToken<AccessibilityPreferencesRepository>('ACCESSIBILITY_PREFERENCES_REPOSITORY');

export const USER_PROFILE_REPOSITORY = new InjectionToken<UserProfileRepository>(
  'USER_PROFILE_REPOSITORY',
);
