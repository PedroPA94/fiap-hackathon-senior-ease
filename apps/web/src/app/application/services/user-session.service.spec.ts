import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import {
  ApplicationError,
  type Clock,
  type IdGenerator,
  type UserProfile,
  type UserProfileRepository,
} from '@senior-ease/core';

import { USER_PROFILE_REPOSITORY } from '../../core/tokens/repository.tokens';
import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import { LocalStorageUserSessionStore } from '../../infrastructure/stores/local-storage-user-session.store';
import { UserSessionError } from '../errors/user-session.error';
import { DismissedRemindersService } from './dismissed-reminders.service';
import { UserSessionService } from './user-session.service';

describe('UserSessionService', () => {
  const now = '2026-07-13T12:00:00.000Z';
  const profile: UserProfile = {
    id: 'user-1',
    name: 'Maria Silva',
    createdAt: now,
    updatedAt: now,
  };

  let service: UserSessionService;
  let userProfileRepositoryMock: {
    findById: ReturnType<typeof vi.fn<UserProfileRepository['findById']>>;
    create: ReturnType<typeof vi.fn<UserProfileRepository['create']>>;
  };
  let clockMock: {
    now: ReturnType<typeof vi.fn<Clock['now']>>;
  };
  let idGeneratorMock: {
    generate: ReturnType<typeof vi.fn<IdGenerator['generate']>>;
  };
  let dismissedRemindersServiceMock: {
    clear: ReturnType<typeof vi.fn<DismissedRemindersService['clear']>>;
  };
  let userSessionStoreMock: {
    getCurrentUserId: ReturnType<typeof vi.fn<LocalStorageUserSessionStore['getCurrentUserId']>>;
    setCurrentUserId: ReturnType<typeof vi.fn<LocalStorageUserSessionStore['setCurrentUserId']>>;
    clearCurrentUserId: ReturnType<
      typeof vi.fn<LocalStorageUserSessionStore['clearCurrentUserId']>
    >;
    listLocalUsers: ReturnType<typeof vi.fn<LocalStorageUserSessionStore['listLocalUsers']>>;
    saveLocalUser: ReturnType<typeof vi.fn<LocalStorageUserSessionStore['saveLocalUser']>>;
    hasCompletedOnboarding: ReturnType<
      typeof vi.fn<LocalStorageUserSessionStore['hasCompletedOnboarding']>
    >;
    markOnboardingCompleted: ReturnType<
      typeof vi.fn<LocalStorageUserSessionStore['markOnboardingCompleted']>
    >;
  };

  beforeEach(() => {
    userProfileRepositoryMock = {
      findById: vi.fn<UserProfileRepository['findById']>(),
      create: vi.fn<UserProfileRepository['create']>(),
    };
    clockMock = {
      now: vi.fn<Clock['now']>().mockReturnValue(now),
    };
    idGeneratorMock = {
      generate: vi.fn<IdGenerator['generate']>().mockReturnValue(profile.id),
    };
    dismissedRemindersServiceMock = {
      clear: vi.fn<DismissedRemindersService['clear']>(),
    };
    userSessionStoreMock = {
      getCurrentUserId: vi.fn<LocalStorageUserSessionStore['getCurrentUserId']>(),
      setCurrentUserId: vi.fn<LocalStorageUserSessionStore['setCurrentUserId']>(),
      clearCurrentUserId: vi.fn<LocalStorageUserSessionStore['clearCurrentUserId']>(),
      listLocalUsers: vi.fn<LocalStorageUserSessionStore['listLocalUsers']>().mockReturnValue([]),
      saveLocalUser: vi.fn<LocalStorageUserSessionStore['saveLocalUser']>(),
      hasCompletedOnboarding:
        vi.fn<LocalStorageUserSessionStore['hasCompletedOnboarding']>(),
      markOnboardingCompleted:
        vi.fn<LocalStorageUserSessionStore['markOnboardingCompleted']>(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserSessionService,
        { provide: USER_PROFILE_REPOSITORY, useValue: userProfileRepositoryMock },
        { provide: CLOCK, useValue: clockMock },
        { provide: ID_GENERATOR, useValue: idGeneratorMock },
        { provide: LocalStorageUserSessionStore, useValue: userSessionStoreMock },
        { provide: DismissedRemindersService, useValue: dismissedRemindersServiceMock },
      ],
    });

    service = TestBed.inject(UserSessionService);
  });

  it('should return the current user id from the session store', () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);

    expect(service.getCurrentUserId()).toBe(profile.id);
  });

  it('should check onboarding for an explicitly informed user', () => {
    userSessionStoreMock.hasCompletedOnboarding.mockReturnValue(true);

    expect(service.hasCompletedOnboarding('user-2')).toBe(true);
    expect(userSessionStoreMock.hasCompletedOnboarding).toHaveBeenCalledWith('user-2');
    expect(userSessionStoreMock.getCurrentUserId).not.toHaveBeenCalled();
  });

  it('should check onboarding for the current user when no user is informed', () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);

    service.hasCompletedOnboarding();

    expect(userSessionStoreMock.hasCompletedOnboarding).toHaveBeenCalledWith(profile.id);
  });

  it('should return false for onboarding when there is no current user', () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(null);

    expect(service.hasCompletedOnboarding()).toBe(false);
    expect(userSessionStoreMock.hasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it('should mark onboarding completion for the current user', () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);

    service.markOnboardingCompleted();

    expect(userSessionStoreMock.markOnboardingCompleted).toHaveBeenCalledWith(profile.id);
  });

  it('should require a current user to mark onboarding completion', () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(null);
    let thrownError: unknown;

    try {
      service.markOnboardingCompleted();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(UserSessionError);
    expect(thrownError).toMatchObject({ code: 'CURRENT_USER_REQUIRED' });
    expect(userSessionStoreMock.markOnboardingCompleted).not.toHaveBeenCalled();
  });

  it('should return the personalization setup route for pending onboarding', () => {
    userSessionStoreMock.hasCompletedOnboarding.mockReturnValue(false);

    expect(service.getInitialRouteForUser('user-1')).toBe('/personalization/setup');
  });

  it('should return home for a user with completed onboarding', () => {
    userSessionStoreMock.hasCompletedOnboarding.mockImplementation(
      (userId) => userId === 'user-2',
    );

    expect(service.getInitialRouteForUser('user-1')).toBe('/personalization/setup');
    expect(service.getInitialRouteForUser('user-2')).toBe('/home');
  });

  it('should return null when there is no current user profile selected', async () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(null);

    await expect(firstValueFrom(service.getCurrentUserProfile())).resolves.toBeNull();

    expect(userProfileRepositoryMock.findById).not.toHaveBeenCalled();
  });

  it('should clear the current user when the stored profile no longer exists', async () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);
    userProfileRepositoryMock.findById.mockResolvedValue(null);

    await expect(firstValueFrom(service.getCurrentUserProfile())).resolves.toBeNull();

    expect(userSessionStoreMock.clearCurrentUserId).toHaveBeenCalledOnce();
    expect(dismissedRemindersServiceMock.clear).toHaveBeenCalledOnce();
  });

  it('should rethrow unexpected errors while loading the current profile', async () => {
    const error = new ApplicationError('ACTIVITY_NOT_FOUND');
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);
    userProfileRepositoryMock.findById.mockRejectedValue(error);

    await expect(firstValueFrom(service.getCurrentUserProfile())).rejects.toBe(error);
  });

  it('should list local users from the session store', () => {
    const localUsers = [{ id: profile.id, name: profile.name, lastAccessedAt: now }];
    userSessionStoreMock.listLocalUsers.mockReturnValue(localUsers);

    expect(service.listLocalUsers()).toEqual(localUsers);
  });

  it('should create a local user and persist it as the current session', async () => {
    userProfileRepositoryMock.create.mockResolvedValue(profile);

    await expect(firstValueFrom(service.createLocalUser(profile.name))).resolves.toEqual(profile);

    expect(userProfileRepositoryMock.create).toHaveBeenCalledWith(profile);
    expect(userSessionStoreMock.setCurrentUserId).toHaveBeenCalledWith(profile.id);
    expect(userSessionStoreMock.saveLocalUser).toHaveBeenCalledWith({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: now,
    });
  });

  it('should select an existing local user and refresh its last access date', async () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue(profile.id);
    userProfileRepositoryMock.findById.mockResolvedValue(profile);

    await expect(firstValueFrom(service.selectLocalUser(profile.id))).resolves.toEqual(profile);

    expect(userProfileRepositoryMock.findById).toHaveBeenCalledWith(profile.id);
    expect(userSessionStoreMock.setCurrentUserId).toHaveBeenCalledWith(profile.id);
    expect(userSessionStoreMock.saveLocalUser).toHaveBeenCalledWith({
      id: profile.id,
      name: profile.name,
      lastAccessedAt: now,
    });
    expect(dismissedRemindersServiceMock.clear).not.toHaveBeenCalled();
  });

  it('should clear dismissed reminders when another user becomes current', async () => {
    userSessionStoreMock.getCurrentUserId.mockReturnValue('user-2');
    userProfileRepositoryMock.findById.mockResolvedValue(profile);

    await firstValueFrom(service.selectLocalUser(profile.id));

    expect(dismissedRemindersServiceMock.clear).toHaveBeenCalledOnce();
    expect(userSessionStoreMock.setCurrentUserId).toHaveBeenCalledWith(profile.id);
  });

  it('should clear the current user session', () => {
    service.clearCurrentUser();

    expect(userSessionStoreMock.clearCurrentUserId).toHaveBeenCalledOnce();
    expect(dismissedRemindersServiceMock.clear).toHaveBeenCalledOnce();
  });
});
