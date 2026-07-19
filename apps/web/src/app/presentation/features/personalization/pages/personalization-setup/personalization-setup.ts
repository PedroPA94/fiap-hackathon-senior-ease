import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Header } from '../../../../shared/layout/header/header';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import type {
  AccessibilityPreferences,
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from '@senior-ease/core';
import { Card } from '../../../../shared/ui/card/card';
import { AccessibilityPreferencesForm } from '../../components/accessibility-preferences-form/accessibility-preferences-form';
import { Button } from '../../../../shared/ui/button/button';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { InlineAlert } from '../../../../shared/feedback/inline-alert/inline-alert';
import { AccessibilityPreferencesService } from '../../../../../application/services/accessibility-preferences.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createAccessibilityTheme } from '@senior-ease/tokens';
import { catchError, EMPTY, filter, from, map, switchMap, tap } from 'rxjs';
import { ThemeService } from '../../../../../application/services/theme.service';
import { UserSessionService } from '../../../../../application/services/user-session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'se-personalization-setup',
  imports: [Header, Card, AccessibilityPreferencesForm, Button, ReactiveFormsModule, InlineAlert],
  templateUrl: './personalization-setup.html',
  styleUrl: './personalization-setup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalizationSetup {
  private accessibilityPreferencesService = inject(AccessibilityPreferencesService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
  private userSessionService = inject(UserSessionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly saveErrorMessage = signal<string | null>(null);

  protected readonly form = new FormGroup({
    fontSize: new FormControl<FontSizePreference>('large', {
      nonNullable: true,
    }),
    spacing: new FormControl<SpacingPreference>('wide', {
      nonNullable: true,
    }),
    contrast: new FormControl<ContrastPreference>('high', {
      nonNullable: true,
    }),
    interfaceMode: new FormControl<InterfaceMode>('advanced', {
      nonNullable: true,
    }),
  });

  protected loadedPreferences: AccessibilityPreferences | null = null;

  ngOnInit() {
    this.loadPreferences();
    this.initializaPreviewPreferences();
  }

  loadPreferences() {
    this.accessibilityPreferencesService.getPreferences().subscribe({
      next: (preferences) => {
        this.form.setValue(
          {
            fontSize: preferences.fontSize,
            spacing: preferences.spacing,
            contrast: preferences.contrast,
            interfaceMode: preferences.interfaceMode,
          },
          {
            emitEvent: false,
          },
        );
        this.loadedPreferences = preferences;
        this.loadErrorMessage.set(null);
      },
      error: (error) => {
        console.error('Erro ao carregar preferências:', error);
        this.loadErrorMessage.set('Não foi possível carregar suas preferências ');
      },
    });
  }

  submit() {
    const preferences: AccessibilityPreferences = {
      ...this.loadedPreferences!,
      ...this.form.getRawValue(),
    };

    this.saveErrorMessage.set(null);

    this.accessibilityPreferencesService
      .updatePreferences(preferences)
      .pipe(
        tap((savedPreferences) => {
          this.loadedPreferences = savedPreferences;

          this.themeService.applyTheme(createAccessibilityTheme(savedPreferences));

          this.userSessionService.markOnboardingCompleted();

          this.toastService.success('Preferências salvas com sucesso.');
        }),
        switchMap(() => from(this.router.navigateByUrl('/home'))),
        catchError(() => {
          this.saveErrorMessage.set('Não foi possível salvar suas preferências.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private initializaPreviewPreferences() {
    this.form.valueChanges
      .pipe(
        filter(() => this.loadedPreferences !== null),
        map((): AccessibilityPreferences => ({
          ...this.loadedPreferences!,
          ...this.form.getRawValue(),
        })),
        tap((preferences) => {
          this.themeService.applyTheme(createAccessibilityTheme(preferences));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
