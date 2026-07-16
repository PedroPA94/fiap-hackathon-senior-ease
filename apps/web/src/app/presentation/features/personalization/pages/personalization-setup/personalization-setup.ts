import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';

import { UserSessionService } from '../../../../../application/services/user-session.service';
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
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'se-personalization-setup',
  imports: [
    Header,
    Card,
    AccessibilityPreferencesForm,
    Button,
    ReactiveFormsModule,
    NgTemplateOutlet,
  ],
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
}
