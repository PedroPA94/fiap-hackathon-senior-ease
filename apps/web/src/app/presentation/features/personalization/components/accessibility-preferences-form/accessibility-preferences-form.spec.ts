import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import type {
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from '@senior-ease/core';

import type { AccessibilityPreferencesFormGroup } from '../../models/accessibility-preferences-form';
import { AccessibilityPreferencesForm } from './accessibility-preferences-form';

describe('AccessibilityPreferencesForm', () => {
  let component: AccessibilityPreferencesForm;
  let fixture: ComponentFixture<AccessibilityPreferencesForm>;
  let form: AccessibilityPreferencesFormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessibilityPreferencesForm],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should render all preference groups', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Tamanho da fonte');
    expect(fixture.nativeElement.textContent).toContain('Espaçamento');
    expect(fixture.nativeElement.textContent).toContain('Contraste');
    expect(fixture.nativeElement.textContent).toContain('Modo de exibição');
  });

  it('should render the expected option labels', () => {
    createComponent();

    expect(getLabels()).toEqual([
      'Normal',
      'Grande',
      'Extra',
      'Normal',
      'Grande',
      'Extra',
      'Padrão',
      'Alto',
      'Básico',
      'Avançado',
    ]);
  });

  it('should check the controls initial values', () => {
    createComponent();

    expect(getInput('font-size', 'large').checked).toBe(true);
    expect(getInput('spacing', 'wide').checked).toBe(true);
    expect(getInput('contrast', 'high').checked).toBe(true);
    expect(getInput('interface-mode', 'advanced').checked).toBe(true);
  });

  it('should update the form when an option is selected', () => {
    createComponent();

    selectInput('font-size', 'extra');
    selectInput('spacing', 'extraWide');
    selectInput('contrast', 'default');
    selectInput('interface-mode', 'basic');

    expect(form.getRawValue()).toEqual({
      fontSize: 'extra',
      spacing: 'extraWide',
      contrast: 'default',
      interfaceMode: 'basic',
    });
  });

  function createComponent(): void {
    form = createForm();
    fixture = TestBed.createComponent(AccessibilityPreferencesForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
  }

  function createForm(): AccessibilityPreferencesFormGroup {
    return new FormGroup({
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

  function getLabels(): string[] {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.segmented-control__pill'),
    ) as HTMLLabelElement[];

    return labels.map((label) => label.textContent?.trim() ?? '');
  }

  function getInput(controlId: string, value: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[name="${controlId}"][value="${value}"]`)!;
  }

  function selectInput(controlId: string, value: string): void {
    const input = getInput(controlId, value);

    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }
});
