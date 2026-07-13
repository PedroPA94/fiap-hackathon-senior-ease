import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { type AccessibilityPreferences } from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';

import { UserSessionError } from '../errors/user-session.error';
import { AccessibilityPreferencesService } from './accessibility-preferences.service';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const preferences: AccessibilityPreferences = {
    fontSize: 'extra',
    contrast: 'high',
    spacing: 'extraWide',
    interfaceMode: 'advanced',
    enhancedFeedback: false,
    confirmCriticalActions: false,
  };

  let service: ThemeService;
  let testDocument: Document;
  let preferencesServiceMock: {
    getPreferences: ReturnType<typeof vi.fn<AccessibilityPreferencesService['getPreferences']>>;
  };

  beforeEach(() => {
    testDocument = document.implementation.createHTMLDocument('ThemeService test');
    preferencesServiceMock = {
      getPreferences: vi.fn<AccessibilityPreferencesService['getPreferences']>(),
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: AccessibilityPreferencesService, useValue: preferencesServiceMock },
        { provide: DOCUMENT, useValue: testDocument },
      ],
    });

    service = TestBed.inject(ThemeService);
  });

  it('should expose default state before a theme is applied', () => {
    expect(service.currentTheme()).toBeNull();
    expect(service.interfaceMode()).toBe('basic');
    expect(service.enhancedFeedback()).toBe(true);
    expect(service.confirmCriticalActions()).toBe(true);
  });

  it('should apply the current user theme to state and CSS variables', async () => {
    preferencesServiceMock.getPreferences.mockResolvedValue(preferences);

    const theme = await service.applyCurrentUserTheme();
    const rootStyle = testDocument.documentElement.style;

    expect(theme).toEqual(createAccessibilityTheme(preferences));
    expect(service.currentTheme()).toEqual(theme);
    expect(service.interfaceMode()).toBe('advanced');
    expect(service.enhancedFeedback()).toBe(false);
    expect(service.confirmCriticalActions()).toBe(false);
    expect(rootStyle.getPropertyValue('--se-color-background-page')).toBe(
      theme.colors.background.page,
    );
    expect(rootStyle.getPropertyValue('--se-font-size-body')).toBe(
      `${theme.typography.body.fontSize}px`,
    );
    expect(rootStyle.getPropertyValue('--se-spacing-small')).toBe(`${theme.spacing.small}px`);
    expect(rootStyle.getPropertyValue('--se-radius-medium')).toBe(`${theme.radius.medium}px`);
    expect(rootStyle.getPropertyValue('--se-border-style-solid')).toBe(theme.borderStyle.solid);
  });

  it('should initialize the default theme when no current user is selected', async () => {
    preferencesServiceMock.getPreferences.mockRejectedValue(
      new UserSessionError('CURRENT_USER_REQUIRED'),
    );

    const theme = await service.initializeTheme();

    expect(theme).toEqual(createAccessibilityTheme());
    expect(service.currentTheme()).toEqual(theme);
  });

  it('should rethrow unexpected initialization errors', async () => {
    const error = new Error('Unexpected failure');
    preferencesServiceMock.getPreferences.mockRejectedValue(error);

    await expect(service.initializeTheme()).rejects.toBe(error);
  });
});
