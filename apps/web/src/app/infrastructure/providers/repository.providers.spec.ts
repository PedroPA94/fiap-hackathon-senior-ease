import { TestBed } from '@angular/core/testing';

import {
  ACCESSIBILITY_PREFERENCES_REPOSITORY,
  USER_PROFILE_REPOSITORY,
} from '../../core/tokens/repository.tokens';
import { LocalStorageAccessibilityPreferencesRepository } from '../repositories/local-storage-accessibility-preferences.repository';
import { LocalStorageUserProfileRepository } from '../repositories/local-storage-user-profile.repository';
import { repositoryProviders } from './repository.providers';

describe('repositoryProviders', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: repositoryProviders,
    });
  });

  it('should provide the local storage accessibility preferences repository', () => {
    expect(TestBed.inject(ACCESSIBILITY_PREFERENCES_REPOSITORY)).toBeInstanceOf(
      LocalStorageAccessibilityPreferencesRepository,
    );
  });

  it('should provide the local storage user profile repository', () => {
    expect(TestBed.inject(USER_PROFILE_REPOSITORY)).toBeInstanceOf(
      LocalStorageUserProfileRepository,
    );
  });
});
