import type { Provider } from '@angular/core';

import {
  ACCESSIBILITY_PREFERENCES_REPOSITORY,
  ACTIVITY_REPOSITORY,
  USER_PROFILE_REPOSITORY,
} from '../../core/tokens/repository.tokens';
import { LocalStorageAccessibilityPreferencesRepository } from '../repositories/local-storage-accessibility-preferences.repository';
import { LocalStorageUserProfileRepository } from '../repositories/local-storage-user-profile.repository';
import { LocalStorageActivityRepository } from '../repositories/local-storage-activity-repository';

export const repositoryProviders: Provider[] = [
  {
    provide: ACCESSIBILITY_PREFERENCES_REPOSITORY,
    useClass: LocalStorageAccessibilityPreferencesRepository,
  },
  {
    provide: USER_PROFILE_REPOSITORY,
    useClass: LocalStorageUserProfileRepository,
  },
  {
    provide: ACTIVITY_REPOSITORY,
    useClass: LocalStorageActivityRepository,
  },
];
