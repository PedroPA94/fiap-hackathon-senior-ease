import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
  type ContrastPreference,
  type FontSizePreference,
  type InterfaceMode,
  type SpacingPreference,
} from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';
import { finalize, merge } from 'rxjs';

import { AccessibilityPreferencesService } from '../../../../../application/services/accessibility-preferences.service';
import { ThemeService } from '../../../../../application/services/theme.service';
import { InlineAlert } from '../../../../shared/feedback/inline-alert/inline-alert';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { Switch } from '../../../../shared/ui/switch/switch';
import { AccessibilityPreferencesForm } from '../../components/accessibility-preferences-form/accessibility-preferences-form';
import type { AccessibilityPreferencesFormGroup } from '../../models/accessibility-preferences-form';

@Component({
  selector: 'se-personalization',
  imports: [
    AccessibilityPreferencesForm,
    Button,
    Card,
    InlineAlert,
    ReactiveFormsModule,
    Switch,
  ],
  templateUrl: './personalization.html',
  styleUrl: './personalization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Personalization implements OnInit, OnDestroy {
  private readonly accessibilityPreferencesService = inject(AccessibilityPreferencesService);
  private readonly themeService = inject(ThemeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isResetting = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly saveErrorMessage = signal<string | null>(null);
  protected readonly hasUnsavedChanges = signal(false);

  protected readonly visualPreferencesForm: AccessibilityPreferencesFormGroup = new FormGroup({
    fontSize: new FormControl<FontSizePreference>(defaultAccessibilityPreferences.fontSize, {
      nonNullable: true,
    }),
    spacing: new FormControl<SpacingPreference>(defaultAccessibilityPreferences.spacing, {
      nonNullable: true,
    }),
    contrast: new FormControl<ContrastPreference>(defaultAccessibilityPreferences.contrast, {
      nonNullable: true,
    }),
    interfaceMode: new FormControl<InterfaceMode>(
      defaultAccessibilityPreferences.interfaceMode,
      { nonNullable: true },
    ),
  });

  protected readonly enhancedFeedbackControl = new FormControl(
    defaultAccessibilityPreferences.enhancedFeedback,
    { nonNullable: true },
  );

  protected readonly confirmCriticalActionsControl = new FormControl(
    defaultAccessibilityPreferences.confirmCriticalActions,
    { nonNullable: true },
  );

  protected persistedPreferences: AccessibilityPreferences | null = null;

  ngOnInit(): void {
    this.initializePreview();
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    if (this.hasUnsavedChanges() && this.persistedPreferences) {
      this.applyPreferencesTheme(this.persistedPreferences);
    }
  }

  protected loadPreferences(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    this.accessibilityPreferencesService
      .getPreferences()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (preferences) => {
          this.persistedPreferences = { ...preferences };
          this.fillControls(preferences);
          this.applyPreferencesTheme(preferences);
          this.hasUnsavedChanges.set(false);
        },
        error: () => {
          this.loadErrorMessage.set('Não foi possível carregar suas preferências.');
        },
      });
  }

  protected submit(): void {
    if (
      this.isLoading() ||
      this.isSaving() ||
      this.isResetting() ||
      !this.persistedPreferences
    ) {
      return;
    }

    const preferences = this.buildCurrentPreferences(this.persistedPreferences);

    this.saveErrorMessage.set(null);
    this.isSaving.set(true);

    this.accessibilityPreferencesService
      .updatePreferences(preferences)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (savedPreferences) => {
          this.confirmPreferences(savedPreferences);
          this.toastService.success('Preferências salvas com sucesso.');
        },
        error: () => {
          this.saveErrorMessage.set('Não foi possível salvar suas preferências.');
        },
      });
  }

  protected resetPreferences(): void {
    if (
      this.isLoading() ||
      this.isSaving() ||
      this.isResetting() ||
      !this.persistedPreferences
    ) {
      return;
    }

    this.saveErrorMessage.set(null);
    this.isResetting.set(true);

    this.accessibilityPreferencesService
      .resetPreferences()
      .pipe(
        finalize(() => this.isResetting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (preferences) => {
          this.confirmPreferences(preferences);
          this.toastService.success('Preferências restauradas com sucesso.');
        },
        error: () => {
          this.saveErrorMessage.set('Não foi possível restaurar as preferências.');
        },
      });
  }

  private initializePreview(): void {
    merge(
      this.visualPreferencesForm.valueChanges,
      this.enhancedFeedbackControl.valueChanges,
      this.confirmCriticalActionsControl.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.persistedPreferences) {
          return;
        }

        this.hasUnsavedChanges.set(true);
        this.applyPreferencesTheme(this.buildCurrentPreferences(this.persistedPreferences));
      });
  }

  private buildCurrentPreferences(
    persistedPreferences: AccessibilityPreferences,
  ): AccessibilityPreferences {
    return {
      ...persistedPreferences,
      ...this.visualPreferencesForm.getRawValue(),
      enhancedFeedback: this.enhancedFeedbackControl.getRawValue(),
      confirmCriticalActions: this.confirmCriticalActionsControl.getRawValue(),
    };
  }

  private confirmPreferences(preferences: AccessibilityPreferences): void {
    this.persistedPreferences = { ...preferences };
    this.fillControls(preferences);
    this.applyPreferencesTheme(preferences);
    this.hasUnsavedChanges.set(false);
  }

  private fillControls(preferences: AccessibilityPreferences): void {
    this.visualPreferencesForm.setValue(
      {
        fontSize: preferences.fontSize,
        spacing: preferences.spacing,
        contrast: preferences.contrast,
        interfaceMode: preferences.interfaceMode,
      },
      { emitEvent: false },
    );
    this.enhancedFeedbackControl.setValue(preferences.enhancedFeedback, { emitEvent: false });
    this.confirmCriticalActionsControl.setValue(preferences.confirmCriticalActions, {
      emitEvent: false,
    });
  }

  private applyPreferencesTheme(preferences: AccessibilityPreferences): void {
    this.themeService.applyTheme(createAccessibilityTheme(preferences));
  }
}
