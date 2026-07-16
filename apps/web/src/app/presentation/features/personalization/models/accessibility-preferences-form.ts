import { FormControl, FormGroup } from '@angular/forms';

import type {
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from '@senior-ease/core';

export type AccessibilityPreferencesFormControls = {
  fontSize: FormControl<FontSizePreference>;
  spacing: FormControl<SpacingPreference>;
  contrast: FormControl<ContrastPreference>;
  interfaceMode: FormControl<InterfaceMode>;
};

export type AccessibilityPreferencesFormGroup = FormGroup<AccessibilityPreferencesFormControls>;
