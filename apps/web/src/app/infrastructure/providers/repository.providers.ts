import type { Provider } from '@angular/core';

import {
  ACCESSIBILITY_PREFERENCES_REPOSITORY,
  USER_PROFILE_REPOSITORY,
} from '../../core/tokens/repository.tokens';
import { LocalStorageAccessibilityPreferencesRepository } from '../repositories/local-storage-accessibility-preferences.repository';
import { LocalStorageUserProfileRepository } from '../repositories/local-storage-user-profile.repository';

export const repositoryProviders: Provider[] = [
  {
    provide: ACCESSIBILITY_PREFERENCES_REPOSITORY,
    useClass: LocalStorageAccessibilityPreferencesRepository,
  },
  {
    provide: USER_PROFILE_REPOSITORY,
    useClass: LocalStorageUserProfileRepository,
  },
];
