import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import type {
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from '@senior-ease/core';

import type { AccessibilityPreferencesFormGroup } from '../../models/accessibility-preferences-form';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../../../../shared/ui/segmented-control/segmented-control';

@Component({
  selector: 'se-accessibility-preferences-form',
  imports: [ReactiveFormsModule, SegmentedControl],
  templateUrl: './accessibility-preferences-form.html',
  styleUrl: './accessibility-preferences-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityPreferencesForm {
  readonly form = input.required<AccessibilityPreferencesFormGroup>();

  protected readonly fontSizeOptions: readonly SegmentedControlOption[] = [
    {
      value: 'normal' satisfies FontSizePreference,
      label: 'Normal',
    },
    {
      value: 'large' satisfies FontSizePreference,
      label: 'Grande',
    },
    {
      value: 'extra' satisfies FontSizePreference,
      label: 'Extra',
    },
  ];

  protected readonly spacingOptions: readonly SegmentedControlOption[] = [
    {
      value: 'comfortable' satisfies SpacingPreference,
      label: 'Normal',
    },
    {
      value: 'wide' satisfies SpacingPreference,
      label: 'Grande',
    },
    {
      value: 'extraWide' satisfies SpacingPreference,
      label: 'Extra',
    },
  ];

  protected readonly contrastOptions: readonly SegmentedControlOption[] = [
    {
      value: 'default' satisfies ContrastPreference,
      label: 'Padrão',
    },
    {
      value: 'high' satisfies ContrastPreference,
      label: 'Alto',
    },
  ];

  protected readonly interfaceModeOptions: readonly SegmentedControlOption[] = [
    {
      value: 'basic' satisfies InterfaceMode,
      label: 'Básico',
    },
    {
      value: 'advanced' satisfies InterfaceMode,
      label: 'Avançado',
    },
  ];
}
