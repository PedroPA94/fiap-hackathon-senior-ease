import { TestBed } from '@angular/core/testing';

import { storageKeys } from '../../core/constants/storage-keys';
import { LocalStorageUserSessionStore } from './local-storage-user-session.store';

describe('LocalStorageUserSessionStore', () => {
  const currentUserId = 'user-1';
  const localUser = {
    id: currentUserId,
    name: 'Maria Silva',
    lastAccessedAt: '2026-07-13T12:00:00.000Z',
  };
  const olderLocalUser = {
    id: 'user-2',
    name: 'Joao Silva',
    lastAccessedAt: '2026-07-12T12:00:00.000Z',
  };

  let store: LocalStorageUserSessionStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LocalStorageUserSessionStore],
    });

    store = TestBed.inject(LocalStorageUserSessionStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should manage the current user id', () => {
    expect(store.getCurrentUserId()).toBeNull();

    store.setCurrentUserId(currentUserId);

    expect(store.getCurrentUserId()).toBe(currentUserId);

    store.clearCurrentUserId();

    expect(store.getCurrentUserId()).toBeNull();
  });

  it('should return false when onboarding completion is not stored', () => {
    expect(store.hasCompletedOnboarding(currentUserId)).toBe(false);
  });

  it('should persist onboarding completion for the informed user only', () => {
    store.markOnboardingCompleted(currentUserId);

    expect(store.hasCompletedOnboarding(currentUserId)).toBe(true);
    expect(store.hasCompletedOnboarding(olderLocalUser.id)).toBe(false);
    expect(localStorage.getItem(storageKeys.onboardingCompleted(currentUserId))).toBe('true');
  });

  it('should treat malformed onboarding completion as pending without throwing', () => {
    const onboardingKey = storageKeys.onboardingCompleted(currentUserId);
    localStorage.setItem(onboardingKey, '{invalid-json');

    expect(() => store.hasCompletedOnboarding(currentUserId)).not.toThrow();
    expect(store.hasCompletedOnboarding(currentUserId)).toBe(false);
    expect(localStorage.getItem(onboardingKey)).toBeNull();
  });

  it('should not change the current user or user index when completing onboarding', () => {
    localStorage.setItem(storageKeys.currentUserId, olderLocalUser.id);
    localStorage.setItem(storageKeys.userIndex, JSON.stringify([localUser, olderLocalUser]));
    const storedUserIndex = localStorage.getItem(storageKeys.userIndex);

    store.markOnboardingCompleted(currentUserId);

    expect(localStorage.getItem(storageKeys.currentUserId)).toBe(olderLocalUser.id);
    expect(localStorage.getItem(storageKeys.userIndex)).toBe(storedUserIndex);
  });

  it('should return an empty list when there are no local users', () => {
    expect(store.listLocalUsers()).toEqual([]);
  });

  it('should list only valid local users', () => {
    localStorage.setItem(
      storageKeys.userIndex,
      JSON.stringify([
        localUser,
        { id: '', name: 'Invalid', lastAccessedAt: '2026-07-13T12:00:00.000Z' },
        null,
      ]),
    );

    expect(store.listLocalUsers()).toEqual([localUser]);
  });

  it('should remove malformed local user indexes', () => {
    localStorage.setItem(storageKeys.userIndex, '{invalid-json');

    expect(store.listLocalUsers()).toEqual([]);
    expect(localStorage.getItem(storageKeys.userIndex)).toBeNull();
  });

  it('should remove non-array local user indexes', () => {
    localStorage.setItem(storageKeys.userIndex, JSON.stringify({ users: [localUser] }));

    expect(store.listLocalUsers()).toEqual([]);
    expect(localStorage.getItem(storageKeys.userIndex)).toBeNull();
  });

  it('should save local users ordered by last access and replace duplicates', () => {
    localStorage.setItem(
      storageKeys.userIndex,
      JSON.stringify([
        { ...localUser, lastAccessedAt: '2026-07-10T12:00:00.000Z' },
        olderLocalUser,
      ]),
    );

    store.saveLocalUser(localUser);

    expect(JSON.parse(localStorage.getItem(storageKeys.userIndex) ?? '[]')).toEqual([
      localUser,
      olderLocalUser,
    ]);
  });
});
