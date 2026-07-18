import { Component } from '@angular/core';

import { Header } from '../../../../shared/layout/header/header';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from '@senior-ease/core';
import { Card } from '../../../../shared/ui/card/card';
import { AccessibilityPreferencesForm } from '../../components/accessibility-preferences-form/accessibility-preferences-form';
import { Button } from '../../../../shared/ui/button/button';

@Component({
  selector: 'se-personalization-setup',
  imports: [Header, Card, AccessibilityPreferencesForm, Button, ReactiveFormsModule],
  templateUrl: './personalization-setup.html',
  styleUrl: './personalization-setup.scss',
})
export class PersonalizationSetup {
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

  submit() {
    console.log('Form submitted:', this.form.value);
  }
}
