import { TestBed } from '@angular/core/testing';

import { type UserProfile } from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';
import { LocalStorageUserProfileRepository } from './local-storage-user-profile.repository';

describe('LocalStorageUserProfileRepository', () => {
  const userId = 'user-1';
  const storageKey = storageKeys.userProfile(userId);
  const profile: UserProfile = {
    id: userId,
    name: 'Maria Silva',
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
  };

  let repository: LocalStorageUserProfileRepository;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LocalStorageUserProfileRepository],
    });

    repository = TestBed.inject(LocalStorageUserProfileRepository);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return null when the profile is not stored', async () => {
    await expect(repository.findById(userId)).resolves.toBeNull();
  });

  it('should return a stored profile when it is valid', async () => {
    localStorage.setItem(storageKey, JSON.stringify(profile));

    await expect(repository.findById(userId)).resolves.toEqual(profile);
  });

  it('should normalize a stored profile before returning it', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...profile, name: '  Maria Silva  ' }));

    await expect(repository.findById(userId)).resolves.toEqual(profile);
  });

  it('should remove and ignore malformed stored profiles', async () => {
    localStorage.setItem(storageKey, '{invalid-json');

    await expect(repository.findById(userId)).resolves.toBeNull();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should remove and ignore invalid stored profiles', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...profile, name: ' ' }));

    await expect(repository.findById(userId)).resolves.toBeNull();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should create and store a normalized profile', async () => {
    const input = { ...profile, name: '  Maria Silva  ' };

    await expect(repository.create(input)).resolves.toEqual(profile);

    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(profile));
  });
});
