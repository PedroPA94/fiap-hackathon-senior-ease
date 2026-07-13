import { TestBed } from '@angular/core/testing';

import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
} from '@senior-ease/core';

import { ACCESSIBILITY_PREFERENCES_REPOSITORY } from '../../core/tokens/repository.tokens';
import { UserSessionError } from '../errors/user-session.error';
import { AccessibilityPreferencesService } from './accessibility-preferences.service';
import { UserSessionService } from './user-session.service';

describe('AccessibilityPreferencesService', () => {
  const userId = 'user-1';
  const preferences: AccessibilityPreferences = {
    fontSize: 'large',
    contrast: 'high',
    spacing: 'wide',
    interfaceMode: 'advanced',
    enhancedFeedback: false,
    confirmCriticalActions: false,
  };

  let service: AccessibilityPreferencesService;
  let preferencesRepositoryMock: {
    findByUserId: ReturnType<typeof vi.fn<AccessibilityPreferencesRepository['findByUserId']>>;
    save: ReturnType<typeof vi.fn<AccessibilityPreferencesRepository['save']>>;
  };
  let userSessionServiceMock: {
    getCurrentUserId: ReturnType<typeof vi.fn<UserSessionService['getCurrentUserId']>>;
  };

  beforeEach(() => {
    preferencesRepositoryMock = {
      findByUserId: vi.fn<AccessibilityPreferencesRepository['findByUserId']>(),
      save: vi.fn<AccessibilityPreferencesRepository['save']>(),
    };
    userSessionServiceMock = {
      getCurrentUserId: vi.fn<UserSessionService['getCurrentUserId']>().mockReturnValue(userId),
    };

    TestBed.configureTestingModule({
      providers: [
        AccessibilityPreferencesService,
        {
          provide: ACCESSIBILITY_PREFERENCES_REPOSITORY,
          useValue: preferencesRepositoryMock,
        },
        { provide: UserSessionService, useValue: userSessionServiceMock },
      ],
    });

    service = TestBed.inject(AccessibilityPreferencesService);
  });

  it('should get preferences for the current user', async () => {
    preferencesRepositoryMock.findByUserId.mockResolvedValue(preferences);

    await expect(service.getPreferences()).resolves.toEqual(preferences);

    expect(preferencesRepositoryMock.findByUserId).toHaveBeenCalledWith(userId);
  });

  it('should return default preferences when the current user has none saved', async () => {
    preferencesRepositoryMock.findByUserId.mockResolvedValue(null);

    await expect(service.getPreferences()).resolves.toEqual(defaultAccessibilityPreferences);
  });

  it('should update preferences for the current user', async () => {
    preferencesRepositoryMock.save.mockResolvedValue(preferences);

    await expect(service.updatePreferences(preferences)).resolves.toEqual(preferences);

    expect(preferencesRepositoryMock.save).toHaveBeenCalledWith(userId, preferences);
  });

  it('should reset preferences for the current user', async () => {
    preferencesRepositoryMock.save.mockResolvedValue(defaultAccessibilityPreferences);

    await expect(service.resetPreferences()).resolves.toEqual(defaultAccessibilityPreferences);

    expect(preferencesRepositoryMock.save).toHaveBeenCalledWith(
      userId,
      defaultAccessibilityPreferences,
    );
  });

  it('should require a current user before accessing preferences', async () => {
    userSessionServiceMock.getCurrentUserId.mockReturnValue(null);

    await expect(service.getPreferences()).rejects.toEqual(
      new UserSessionError('CURRENT_USER_REQUIRED'),
    );
    expect(preferencesRepositoryMock.findByUserId).not.toHaveBeenCalled();
  });
});
