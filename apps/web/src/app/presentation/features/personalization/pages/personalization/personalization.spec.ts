import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
} from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';
import { of, Subject, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';

import { routes } from '../../../../../app.routes';
import { AccessibilityPreferencesService } from '../../../../../application/services/accessibility-preferences.service';
import { ThemeService } from '../../../../../application/services/theme.service';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { AppShell } from '../../../../shared/layout/app-shell/app-shell';
import { PersonalizationSetup } from '../personalization-setup/personalization-setup';
import { Personalization } from './personalization';

describe('Personalization', () => {
  const loadedPreferences: AccessibilityPreferences = {
    fontSize: 'extra',
    spacing: 'extraWide',
    contrast: 'high',
    interfaceMode: 'advanced',
    enhancedFeedback: false,
    confirmCriticalActions: true,
    remindersEnabled: true,
    reminderAdvance: 'oneDay',
  };

  let accessibilityPreferencesService: AccessibilityPreferencesServiceMock;
  let component: Personalization;
  let fixture: ComponentFixture<Personalization>;
  let themeService: ThemeServiceMock;
  let toastService: ToastServiceMock;

  beforeEach(async () => {
    accessibilityPreferencesService = {
      getPreferences: vi.fn(() => of(loadedPreferences)),
      updatePreferences: vi.fn((preferences) => of(preferences)),
      resetPreferences: vi.fn(() => of(defaultAccessibilityPreferences)),
    };
    themeService = { applyTheme: vi.fn() };
    toastService = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Personalization],
      providers: [
        { provide: AccessibilityPreferencesService, useValue: accessibilityPreferencesService },
        { provide: ThemeService, useValue: themeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates, loads preferences and renders the complete page without duplicating the shell', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(accessibilityPreferencesService.getPreferences).toHaveBeenCalledOnce();
    expect(getText()).toContain('Personalização');
    expect(getText()).toContain('Ajuste o visual para uma experiência mais confortável.');
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('section')?.getAttribute('aria-labelledby')).toBe(
      'personalization-title',
    );
    expect(fixture.nativeElement.querySelectorAll('se-accessibility-preferences-form')).toHaveLength(
      1,
    );
    expect(fixture.nativeElement.querySelectorAll('se-switch')).toHaveLength(3);
    expect(getText()).toContain('Lembretes');
    expect(getButtons()).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('se-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('se-navigation-menu')).toBeNull();
  });

  it('keeps personalization routes lazy-loaded in their respective layouts', async () => {
    const shellRoute = routes.find((route) => route.path === '' && route.children);
    const personalizationRoute = shellRoute?.children?.find(
      (route) => route.path === 'personalization',
    );
    const setupRoute = routes.find((route) => route.path === 'personalization/setup');

    expect(shellRoute?.canActivate).toBeDefined();
    expect(personalizationRoute?.canActivate).toBeUndefined();
    expect(await shellRoute?.loadComponent?.()).toBe(AppShell);
    expect(await personalizationRoute?.loadComponent?.()).toBe(Personalization);
    expect(await setupRoute?.loadComponent?.()).toBe(PersonalizationSetup);
  });

  it('shows an accessible loading state while preferences are pending', () => {
    const loadSubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.getPreferences.mockReturnValue(loadSubject.asObservable());

    createComponent();

    expect(getText()).toContain('Carregando preferências...');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    expect(getContentRegion().getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('fills all eight controls without treating initialization as an edit preview', () => {
    createComponent();

    expect(getPreferenceInput('font-size', 'extra').checked).toBe(true);
    expect(getPreferenceInput('spacing', 'extraWide').checked).toBe(true);
    expect(getPreferenceInput('contrast', 'high').checked).toBe(true);
    expect(getPreferenceInput('interface-mode', 'advanced').checked).toBe(true);
    expect(getSwitchInput('enhanced-feedback').checked).toBe(false);
    expect(getSwitchInput('confirm-critical-actions').checked).toBe(true);
    expect(getSwitchInput('reminders-enabled').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'oneDay').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'oneDay').disabled).toBe(false);
    expect(themeService.applyTheme).toHaveBeenCalledOnce();
    expect(themeService.applyTheme).toHaveBeenLastCalledWith(
      createAccessibilityTheme(loadedPreferences),
    );
    expect(getContentRegion().getAttribute('aria-busy')).toBe('false');
  });

  it('ends loading on error, shows the load error and retries successfully', () => {
    accessibilityPreferencesService.getPreferences
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(of(loadedPreferences));

    createComponent();

    expect(getContentRegion().getAttribute('aria-busy')).toBe('false');
    expect(getText()).toContain('Não foi possível carregar suas preferências.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    getAlertAction()?.click();
    fixture.detectChanges();

    expect(accessibilityPreferencesService.getPreferences).toHaveBeenCalledTimes(2);
    expect(getText()).not.toContain('Não foi possível carregar suas preferências.');
    expect(getPreferenceInput('font-size', 'extra').checked).toBe(true);
  });

  it('prevents concurrent retries while the retry request is pending', () => {
    const retrySubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.getPreferences
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(retrySubject.asObservable());
    createComponent();
    const retryButton = getAlertAction();

    retryButton?.click();
    retryButton?.click();

    expect(accessibilityPreferencesService.getPreferences).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['font-size', 'normal', { fontSize: 'normal' }],
    ['spacing', 'comfortable', { spacing: 'comfortable' }],
    ['contrast', 'default', { contrast: 'default' }],
    ['interface-mode', 'basic', { interfaceMode: 'basic' }],
  ] as const)(
    'applies a complete preview when %s changes without persisting it',
    (controlId, value, changedPreference) => {
      createComponent();
      themeService.applyTheme.mockClear();

      selectPreference(controlId, value);

      expect(themeService.applyTheme).toHaveBeenCalledOnce();
      expect(themeService.applyTheme).toHaveBeenCalledWith(
        createAccessibilityTheme({ ...loadedPreferences, ...changedPreference }),
      );
      expect(accessibilityPreferencesService.updatePreferences).not.toHaveBeenCalled();
    },
  );

  it('includes both boolean controls in preview and uses unique switch IDs', () => {
    createComponent();
    themeService.applyTheme.mockClear();

    toggleSwitch('enhanced-feedback', true);
    toggleSwitch('confirm-critical-actions', false);

    expect(themeService.applyTheme).toHaveBeenLastCalledWith(
      createAccessibilityTheme({
        ...loadedPreferences,
        enhancedFeedback: true,
        confirmCriticalActions: false,
      }),
    );
    expect(fixture.nativeElement.querySelectorAll('#enhanced-feedback')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('#confirm-critical-actions')).toHaveLength(1);
    expect(accessibilityPreferencesService.updatePreferences).not.toHaveBeenCalled();
  });

  it('updates reminder controls and preserves the selected advance when toggled off and on', () => {
    createComponent();

    selectPreference('reminder-advance', 'thirtyMinutes');
    expect(getPreferenceInput('reminder-advance', 'thirtyMinutes').checked).toBe(true);

    toggleSwitch('reminders-enabled', false);
    expect(getSwitchInput('reminders-enabled').checked).toBe(false);
    expect(getPreferenceInput('reminder-advance', 'thirtyMinutes').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'thirtyMinutes').disabled).toBe(true);

    toggleSwitch('reminders-enabled', true);
    expect(getSwitchInput('reminders-enabled').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'thirtyMinutes').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'thirtyMinutes').disabled).toBe(false);
  });

  it('initializes the reminder advance disabled when saved reminders are off', () => {
    accessibilityPreferencesService.getPreferences.mockReturnValue(
      of({ ...loadedPreferences, remindersEnabled: false }),
    );

    createComponent();

    expect(getSwitchInput('reminders-enabled').checked).toBe(false);
    expect(getPreferenceInput('reminder-advance', 'oneDay').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'oneDay').disabled).toBe(true);
  });

  it('submits all eight preferences once and exposes the saving state', () => {
    const saveSubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.updatePreferences.mockReturnValue(saveSubject.asObservable());
    createComponent();
    selectPreference('font-size', 'normal');
    toggleSwitch('enhanced-feedback', true);
    selectPreference('reminder-advance', 'oneHour');
    toggleSwitch('reminders-enabled', false);

    submitForm();
    submitForm();
    fixture.detectChanges();

    expect(accessibilityPreferencesService.updatePreferences).toHaveBeenCalledOnce();
    expect(accessibilityPreferencesService.updatePreferences).toHaveBeenCalledWith({
      ...loadedPreferences,
      fontSize: 'normal',
      enhancedFeedback: true,
      remindersEnabled: false,
      reminderAdvance: 'oneHour',
    });
    expect(getButtons()[0].getAttribute('aria-busy')).toBe('true');
    expect(getContentRegion().getAttribute('aria-busy')).toBe('true');
  });

  it('confirms returned preferences, applies their theme and reports save success', () => {
    const savedPreferences: AccessibilityPreferences = {
      ...loadedPreferences,
      fontSize: 'normal',
      enhancedFeedback: true,
    };
    accessibilityPreferencesService.updatePreferences.mockReturnValue(of(savedPreferences));
    createComponent();
    selectPreference('font-size', 'normal');
    toggleSwitch('enhanced-feedback', true);
    themeService.applyTheme.mockClear();

    submitForm();
    fixture.detectChanges();

    expect(getPreferenceInput('font-size', 'normal').checked).toBe(true);
    expect(getSwitchInput('enhanced-feedback').checked).toBe(true);
    expect(themeService.applyTheme).toHaveBeenLastCalledWith(
      createAccessibilityTheme(savedPreferences),
    );
    expect(toastService.success).toHaveBeenCalledWith('Preferências salvas com sucesso.');
    expect(getContentRegion().getAttribute('aria-busy')).toBe('false');

    themeService.applyTheme.mockClear();
    fixture.destroy();
    expect(themeService.applyTheme).not.toHaveBeenCalled();
  });

  it('keeps the edited values and preview when save fails, showing only an inline error', () => {
    accessibilityPreferencesService.updatePreferences.mockReturnValue(
      throwError(() => new Error('Save failed')),
    );
    createComponent();
    selectPreference('font-size', 'normal');
    const previewTheme = createAccessibilityTheme({ ...loadedPreferences, fontSize: 'normal' });
    expect(themeService.applyTheme).toHaveBeenLastCalledWith(previewTheme);
    themeService.applyTheme.mockClear();

    submitForm();
    fixture.detectChanges();

    expect(getPreferenceInput('font-size', 'normal').checked).toBe(true);
    expect(getText()).toContain('Não foi possível salvar suas preferências.');
    expect(themeService.applyTheme).not.toHaveBeenCalled();
    expect(toastService.success).not.toHaveBeenCalled();

    fixture.destroy();
    expect(themeService.applyTheme).toHaveBeenLastCalledWith(
      createAccessibilityTheme(loadedPreferences),
    );
  });

  it('resets once, exposes loading and blocks save while reset is pending', () => {
    const resetSubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.resetPreferences.mockReturnValue(resetSubject.asObservable());
    createComponent();

    clickReset();
    clickReset();
    submitForm();
    fixture.detectChanges();

    expect(accessibilityPreferencesService.resetPreferences).toHaveBeenCalledOnce();
    expect(accessibilityPreferencesService.updatePreferences).not.toHaveBeenCalled();
    expect(getButtons()[1].getAttribute('aria-busy')).toBe('true');
  });

  it('fills all controls, applies the theme and reports reset success', () => {
    createComponent();
    selectPreference('font-size', 'normal');
    toggleSwitch('confirm-critical-actions', false);
    themeService.applyTheme.mockClear();

    clickReset();
    fixture.detectChanges();

    expect(getPreferenceInput('font-size', 'normal').checked).toBe(true);
    expect(getPreferenceInput('spacing', 'comfortable').checked).toBe(true);
    expect(getPreferenceInput('contrast', 'default').checked).toBe(true);
    expect(getPreferenceInput('interface-mode', 'basic').checked).toBe(true);
    expect(getSwitchInput('enhanced-feedback').checked).toBe(true);
    expect(getSwitchInput('confirm-critical-actions').checked).toBe(true);
    expect(getSwitchInput('reminders-enabled').checked).toBe(false);
    expect(getPreferenceInput('reminder-advance', 'atTime').checked).toBe(true);
    expect(getPreferenceInput('reminder-advance', 'atTime').disabled).toBe(true);
    expect(themeService.applyTheme).toHaveBeenLastCalledWith(
      createAccessibilityTheme(defaultAccessibilityPreferences),
    );
    expect(toastService.success).toHaveBeenCalledWith('Preferências restauradas com sucesso.');

    themeService.applyTheme.mockClear();
    fixture.destroy();
    expect(themeService.applyTheme).not.toHaveBeenCalled();
  });

  it('preserves current values and preview when reset fails', () => {
    accessibilityPreferencesService.resetPreferences.mockReturnValue(
      throwError(() => new Error('Reset failed')),
    );
    createComponent();
    selectPreference('font-size', 'normal');
    themeService.applyTheme.mockClear();

    clickReset();
    fixture.detectChanges();

    expect(getPreferenceInput('font-size', 'normal').checked).toBe(true);
    expect(getText()).toContain('Não foi possível restaurar as preferências.');
    expect(themeService.applyTheme).not.toHaveBeenCalled();
    expect(toastService.success).not.toHaveBeenCalled();
  });

  it('rolls back the preview on destroy when changes remain unsaved', () => {
    createComponent();
    selectPreference('spacing', 'comfortable');
    themeService.applyTheme.mockClear();

    fixture.destroy();

    expect(themeService.applyTheme).toHaveBeenCalledWith(
      createAccessibilityTheme(loadedPreferences),
    );
  });

  it('does not attempt rollback when destroyed before preferences load', () => {
    const loadSubject = new Subject<AccessibilityPreferences>();
    accessibilityPreferencesService.getPreferences.mockReturnValue(loadSubject.asObservable());
    createComponent();

    expect(() => fixture.destroy()).not.toThrow();
    expect(themeService.applyTheme).not.toHaveBeenCalled();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Personalization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }

  function getContentRegion(): HTMLElement {
    return fixture.nativeElement.querySelector('.personalization__content')!;
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

  function getSwitchInput(inputId: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#${inputId}`)!;
  }

  function toggleSwitch(inputId: string, checked: boolean): void {
    const input = getSwitchInput(inputId);
    input.checked = checked;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  function clickReset(): void {
    getButtons()[1].click();
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.personalization__actions button'));
  }

  function getAlertAction(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.inline-alert__action-message');
  }
});

type AccessibilityPreferencesServiceMock = {
  getPreferences: Mock<() => Observable<AccessibilityPreferences>>;
  updatePreferences: Mock<
    (preferences: AccessibilityPreferences) => Observable<AccessibilityPreferences>
  >;
  resetPreferences: Mock<() => Observable<AccessibilityPreferences>>;
};

type ThemeServiceMock = {
  applyTheme: Mock<ThemeService['applyTheme']>;
};

type ToastServiceMock = {
  success: Mock<ToastService['success']>;
};
