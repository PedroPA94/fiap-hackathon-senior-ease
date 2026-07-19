import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { AccessibilityPreferences, UserProfile } from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';
import { of, Subject, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';

import { AccessibilityPreferencesService } from '../../../../../application/services/accessibility-preferences.service';
import { ThemeService } from '../../../../../application/services/theme.service';
import { UserSessionService } from '../../../../../application/services/user-session.service';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { PersonalizationSetup } from './personalization-setup';

describe('PersonalizationSetup', () => {
  const loadedPreferences: AccessibilityPreferences = {
    fontSize: 'extra',
    spacing: 'extraWide',
    contrast: 'high',
    interfaceMode: 'advanced',
    enhancedFeedback: false,
    confirmCriticalActions: false,
  };

  let accessibilityPreferencesService: AccessibilityPreferencesServiceMock;
  let component: PersonalizationSetup;
  let fixture: ComponentFixture<PersonalizationSetup>;
  let router: RouterMock;
  let themeService: ThemeServiceMock;
  let toastService: ToastServiceMock;
  let userSessionService: UserSessionServiceMock;

  beforeEach(async () => {
    accessibilityPreferencesService = createAccessibilityPreferencesServiceMock();
    router = createRouterMock();
    themeService = createThemeServiceMock();
    toastService = createToastServiceMock();
    userSessionService = createUserSessionServiceMock();

    await TestBed.configureTestingModule({
      imports: [PersonalizationSetup],
      providers: [
        { provide: AccessibilityPreferencesService, useValue: accessibilityPreferencesService },
        { provide: Router, useValue: router },
        { provide: ThemeService, useValue: themeService },
        { provide: ToastService, useValue: toastService },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalizationSetup);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and render the setup content', () => {
    renderComponent();

    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Vamos deixar a tela mais confortável para você',
    );
    expect(fixture.nativeElement.textContent).toContain('Configuração inicial');
    expect(userSessionService.markOnboardingCompleted).not.toHaveBeenCalled();
  });

  it('should load preferences on initialization and select their form options', () => {
    renderComponent();

    expect(accessibilityPreferencesService.getPreferences).toHaveBeenCalledOnce();
    expect(getPreferenceInput('font-size', 'extra').checked).toBe(true);
    expect(getPreferenceInput('spacing', 'extraWide').checked).toBe(true);
    expect(getPreferenceInput('contrast', 'high').checked).toBe(true);
    expect(getPreferenceInput('interface-mode', 'advanced').checked).toBe(true);
  });

  it('should not apply a preview while initializing the form with loaded preferences', () => {
    renderComponent();

    expect(themeService.applyTheme).not.toHaveBeenCalled();
  });

  it('should apply a theme preview when a preference changes after loading', () => {
    renderComponent();

    selectPreference('font-size', 'normal');

    expect(themeService.applyTheme).toHaveBeenCalledOnce();
    expect(themeService.applyTheme).toHaveBeenCalledWith(
      createAccessibilityTheme({
        ...loadedPreferences,
        fontSize: 'normal',
      }),
    );
    expect(userSessionService.markOnboardingCompleted).not.toHaveBeenCalled();
  });

  it('should show a load error with a retry action when loading fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    accessibilityPreferencesService.getPreferences.mockReturnValue(
      throwError(() => new Error('Load failed')),
    );

    renderComponent();

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(getAlerts()).toHaveLength(1);
    expect(getAlerts()[0].textContent).toContain('Não foi possível carregar suas preferências');
    expect(getAlertAction()?.textContent).toContain('Tentar novamente');
  });

  it('should retry loading and remove the error after a successful response', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    accessibilityPreferencesService.getPreferences
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(of(loadedPreferences));
    renderComponent();

    getAlertAction()?.click();
    fixture.detectChanges();

    expect(accessibilityPreferencesService.getPreferences).toHaveBeenCalledTimes(2);
    expect(getAlerts()).toHaveLength(0);
    expect(getPreferenceInput('font-size', 'extra').checked).toBe(true);
  });

  it('should save the complete preferences, apply the saved theme, notify and navigate', async () => {
    const savedPreferences: AccessibilityPreferences = {
      ...loadedPreferences,
      fontSize: 'normal',
    };
    accessibilityPreferencesService.updatePreferences.mockReturnValue(of(savedPreferences));
    renderComponent();
    selectPreference('font-size', 'normal');
    themeService.applyTheme.mockClear();

    submitForm();
    await fixture.whenStable();

    expect(accessibilityPreferencesService.updatePreferences).toHaveBeenCalledWith({
      ...loadedPreferences,
      fontSize: 'normal',
    });
    expect(themeService.applyTheme).toHaveBeenCalledWith(
      createAccessibilityTheme(savedPreferences),
    );
    expect(userSessionService.markOnboardingCompleted).toHaveBeenCalledOnce();
    expect(toastService.success).toHaveBeenCalledWith('Preferências salvas com sucesso.');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    expect(themeService.applyTheme.mock.invocationCallOrder[0]).toBeLessThan(
      userSessionService.markOnboardingCompleted.mock.invocationCallOrder[0],
    );
    expect(userSessionService.markOnboardingCompleted.mock.invocationCallOrder[0]).toBeLessThan(
      router.navigateByUrl.mock.invocationCallOrder[0],
    );
  });

  it('should preserve preferences not represented by form controls when saving', () => {
    renderComponent();

    submitForm();

    expect(accessibilityPreferencesService.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancedFeedback: false,
        confirmCriticalActions: false,
      }),
    );
  });

  it('should mark onboarding only after preference persistence succeeds', () => {
    const updateSubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.updatePreferences.mockReturnValue(updateSubject.asObservable());
    renderComponent();

    submitForm();

    expect(userSessionService.markOnboardingCompleted).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    updateSubject.next(loadedPreferences);

    expect(userSessionService.markOnboardingCompleted).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('should show a save error and avoid side effects when saving fails', () => {
    accessibilityPreferencesService.updatePreferences.mockReturnValue(
      throwError(() => new Error('Save failed')),
    );
    renderComponent();

    submitForm();
    fixture.detectChanges();

    expect(getAlerts()).toHaveLength(1);
    expect(getAlerts()[0].textContent).toContain('Não foi possível salvar suas preferências.');
    expect(getAlertAction()?.textContent).toContain('Tentar novamente');
    expect(themeService.applyTheme).not.toHaveBeenCalled();
    expect(userSessionService.markOnboardingCompleted).not.toHaveBeenCalled();
    expect(toastService.success).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should retry saving through the inline alert action', () => {
    accessibilityPreferencesService.updatePreferences
      .mockReturnValueOnce(throwError(() => new Error('Save failed')))
      .mockReturnValueOnce(of(loadedPreferences));
    renderComponent();
    submitForm();
    fixture.detectChanges();

    getAlertAction()?.click();
    fixture.detectChanges();

    expect(accessibilityPreferencesService.updatePreferences).toHaveBeenCalledTimes(2);
    expect(getAlerts()).toHaveLength(0);
    expect(userSessionService.markOnboardingCompleted).toHaveBeenCalledOnce();
    expect(toastService.success).toHaveBeenCalledWith('Preferências salvas com sucesso.');
  });

  function renderComponent(): void {
    fixture.detectChanges();
  }

  function getPreferenceInput(controlId: string, value: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[name="${controlId}"][value="${value}"]`)!;
  }

  function selectPreference(controlId: string, value: string): void {
    const input = getPreferenceInput(controlId, value);

    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form')!;

    form.dispatchEvent(new Event('submit'));
  }

  function getAlerts(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('se-inline-alert'));
  }

  function getAlertAction(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.inline-alert__action-message');
  }

  function createAccessibilityPreferencesServiceMock(): AccessibilityPreferencesServiceMock {
    return {
      getPreferences: vi.fn(() => of(loadedPreferences)),
      updatePreferences: vi.fn((preferences) => of(preferences)),
    };
  }

  function createRouterMock(): RouterMock {
    return {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
  }

  function createThemeServiceMock(): ThemeServiceMock {
    return {
      applyTheme: vi.fn(),
    };
  }

  function createToastServiceMock(): ToastServiceMock {
    return {
      success: vi.fn(),
    };
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      getCurrentUserProfile: vi.fn(() => of(createUserProfile())),
      clearCurrentUser: vi.fn(),
      markOnboardingCompleted: vi.fn(),
    };
  }

  function createUserProfile(): UserProfile {
    return {
      id: 'user-1',
      name: 'Maria Helena',
      createdAt: '2026-07-14T10:00:00.000Z',
      updatedAt: '2026-07-14T10:00:00.000Z',
    };
  }
});

type AccessibilityPreferencesServiceMock = {
  getPreferences: Mock<AccessibilityPreferencesService['getPreferences']>;
  updatePreferences: Mock<AccessibilityPreferencesService['updatePreferences']>;
};

type RouterMock = {
  navigateByUrl: Mock<(url: string) => Promise<boolean>>;
};

type ThemeServiceMock = {
  applyTheme: Mock<ThemeService['applyTheme']>;
};

type ToastServiceMock = {
  success: Mock<ToastService['success']>;
};

type UserSessionServiceMock = {
  getCurrentUserProfile: Mock<() => Observable<UserProfile | null>>;
  clearCurrentUser: Mock<() => void>;
  markOnboardingCompleted: Mock<() => void>;
};
