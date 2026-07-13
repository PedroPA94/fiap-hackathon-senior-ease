import { TestBed } from '@angular/core/testing';

import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
} from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';
import { LocalStorageAccessibilityPreferencesRepository } from './local-storage-accessibility-preferences.repository';

describe('LocalStorageAccessibilityPreferencesRepository', () => {
  const userId = 'user-1';
  const storageKey = storageKeys.accessibilityPreferences(userId);
  const preferences: AccessibilityPreferences = {
    fontSize: 'large',
    contrast: 'high',
    spacing: 'wide',
    interfaceMode: 'advanced',
    enhancedFeedback: false,
    confirmCriticalActions: false,
  };

  let repository: LocalStorageAccessibilityPreferencesRepository;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LocalStorageAccessibilityPreferencesRepository],
    });

    repository = TestBed.inject(LocalStorageAccessibilityPreferencesRepository);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return null when preferences are not stored', async () => {
    await expect(repository.findByUserId(userId)).resolves.toBeNull();
  });

  it('should return stored preferences when they are valid', async () => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));

    await expect(repository.findByUserId(userId)).resolves.toEqual(preferences);
  });

  it('should remove and ignore malformed stored preferences', async () => {
    localStorage.setItem(storageKey, '{invalid-json');

    await expect(repository.findByUserId(userId)).resolves.toBeNull();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should remove and ignore invalid stored preferences', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...preferences, fontSize: 'tiny' }));

    await expect(repository.findByUserId(userId)).resolves.toBeNull();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should save valid preferences', async () => {
    await expect(repository.save(userId, preferences)).resolves.toEqual(preferences);

    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(preferences));
  });

  it('should reject invalid preferences without storing them', async () => {
    const invalidPreferences = {
      ...defaultAccessibilityPreferences,
      contrast: 'very-high',
    } as unknown as AccessibilityPreferences;

    await expect(repository.save(userId, invalidPreferences)).rejects.toThrow();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
