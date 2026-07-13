import { DOCUMENT } from '@angular/common';
import { computed, Inject, Injectable, signal } from '@angular/core';

import { createAccessibilityTheme, type AccessibilityTheme } from '@senior-ease/tokens';

import { AccessibilityPreferencesService } from './accessibility-preferences.service';
import { UserSessionError } from '../errors/user-session.error';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly currentThemeState = signal<AccessibilityTheme | null>(null);

  readonly currentTheme = this.currentThemeState.asReadonly();
  readonly interfaceMode = computed(() => this.currentThemeState()?.mode ?? 'basic');
  readonly enhancedFeedback = computed(() => this.currentThemeState()?.enhancedFeedback ?? true);
  readonly confirmCriticalActions = computed(
    () => this.currentThemeState()?.confirmCriticalActions ?? true,
  );

  constructor(
    private readonly accessibilityPreferencesService: AccessibilityPreferencesService,

    @Inject(DOCUMENT)
    private readonly document: Document,
  ) {}

  async initializeTheme(): Promise<AccessibilityTheme> {
    try {
      return await this.applyCurrentUserTheme();
    } catch (error) {
      if (error instanceof UserSessionError && error.code === 'CURRENT_USER_REQUIRED') {
        const defaultTheme = createAccessibilityTheme();

        this.applyTheme(defaultTheme);

        return defaultTheme;
      }

      throw error;
    }
  }

  async applyCurrentUserTheme(): Promise<AccessibilityTheme> {
    const preferences = await this.accessibilityPreferencesService.getPreferences();

    const theme = createAccessibilityTheme(preferences);

    this.applyTheme(theme);

    return theme;
  }

  applyTheme(theme: AccessibilityTheme): void {
    this.currentThemeState.set(theme);

    const rootElement = this.document.documentElement;

    this.applyColorVariables(rootElement, theme);
    this.applyTypographyVariables(rootElement, theme);
    this.applySpacingVariables(rootElement, theme);
    this.applyBorderVariables(rootElement, theme);
  }

  private applyColorVariables(rootElement: HTMLElement, theme: AccessibilityTheme): void {
    rootElement.style.setProperty('--se-color-background-page', theme.colors.background.page);

    rootElement.style.setProperty('--se-color-background-surface', theme.colors.background.surface);

    rootElement.style.setProperty(
      '--se-color-background-surface-soft',
      theme.colors.background.surfaceSoft,
    );

    rootElement.style.setProperty('--se-color-text-default', theme.colors.text.default);

    rootElement.style.setProperty('--se-color-text-muted', theme.colors.text.muted);

    rootElement.style.setProperty('--se-color-text-inverse', theme.colors.text.inverse);

    rootElement.style.setProperty('--se-color-primary', theme.colors.primary.default);

    rootElement.style.setProperty('--se-color-primary-strong', theme.colors.primary.strong);

    rootElement.style.setProperty('--se-color-primary-soft', theme.colors.primary.soft);

    rootElement.style.setProperty('--se-color-border-default', theme.colors.border.default);

    rootElement.style.setProperty('--se-color-border-strong', theme.colors.border.strong);

    rootElement.style.setProperty('--se-color-danger', theme.colors.danger.default);

    rootElement.style.setProperty('--se-color-success', theme.colors.success.default);

    rootElement.style.setProperty('--se-color-warning', theme.colors.warning.default);

    rootElement.style.setProperty('--se-color-focus', theme.colors.focus.default);
  }

  private applyTypographyVariables(rootElement: HTMLElement, theme: AccessibilityTheme): void {
    rootElement.style.setProperty('--se-font-family', theme.typography.body.fontFamily);

    rootElement.style.setProperty('--se-font-size-body', `${theme.typography.body.fontSize}px`);

    rootElement.style.setProperty('--se-line-height-body', `${theme.typography.body.lineHeight}px`);

    rootElement.style.setProperty(
      '--se-font-size-body-large',
      `${theme.typography.bodyLarge.fontSize}px`,
    );

    rootElement.style.setProperty('--se-font-size-title', `${theme.typography.title.fontSize}px`);

    rootElement.style.setProperty(
      '--se-font-size-heading',
      `${theme.typography.heading.fontSize}px`,
    );

    rootElement.style.setProperty(
      '--se-font-weight-regular',
      String(theme.typography.body.fontWeight),
    );

    rootElement.style.setProperty(
      '--se-font-weight-bold',
      String(theme.typography.bodyBold.fontWeight),
    );
  }

  private applySpacingVariables(rootElement: HTMLElement, theme: AccessibilityTheme): void {
    for (const [name, value] of Object.entries(theme.spacing)) {
      rootElement.style.setProperty(`--se-spacing-${name}`, `${value}px`);
    }
  }

  private applyBorderVariables(rootElement: HTMLElement, theme: AccessibilityTheme): void {
    for (const [name, value] of Object.entries(theme.radius)) {
      rootElement.style.setProperty(`--se-radius-${name}`, `${value}px`);
    }

    for (const [name, value] of Object.entries(theme.borderWidth)) {
      rootElement.style.setProperty(`--se-border-width-${name}`, `${value}px`);
    }

    for (const [name, value] of Object.entries(theme.borderStyle)) {
      rootElement.style.setProperty(`--se-border-style-${name}`, value);
    }
  }
}
