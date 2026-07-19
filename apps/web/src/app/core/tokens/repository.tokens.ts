import { InjectionToken } from '@angular/core';

import {
  ActivityRepository,
  type AccessibilityPreferencesRepository,
  type UserProfileRepository,
} from '@senior-ease/core';

export const ACCESSIBILITY_PREFERENCES_REPOSITORY =
  new InjectionToken<AccessibilityPreferencesRepository>('ACCESSIBILITY_PREFERENCES_REPOSITORY');

export const USER_PROFILE_REPOSITORY = new InjectionToken<UserProfileRepository>(
  'USER_PROFILE_REPOSITORY',
);

export const ACTIVITY_REPOSITORY = new InjectionToken<ActivityRepository>('ACTIVITY_REPOSITORY');
