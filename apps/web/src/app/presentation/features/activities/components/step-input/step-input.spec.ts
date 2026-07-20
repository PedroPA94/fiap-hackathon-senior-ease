import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';

import {
  createActivityStepControl,
  StepInput,
  type ActivityStepsFormArray,
} from './step-input';

@Component({
  imports: [StepInput],
  template: `<se-step-input [steps]="steps" [disabled]="disabled" />`,
})
class StepInputHost {
  readonly steps: ActivityStepsFormArray = new FormArray([createActivityStepControl()]);
  disabled = false;
}

describe('StepInput', () => {
  let fixture: ComponentFixture<StepInputHost>;
  let host: StepInputHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StepInputHost] }).compileComponents();
    fixture = TestBed.createComponent(StepInputHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with one numbered step associated with its FormControl', () => {
    expect(fixture.nativeElement.querySelector('se-step-input')).toBeTruthy();
    expect(getInputs()).toHaveLength(1);
    expect(getInputs()[0].id).toBe('activity-steps-0');
    expect(getLabels()[0].htmlFor).toBe('activity-steps-0');
    expect(getLabels()[0].textContent).toContain('Descrição da etapa 1');
    expect(getText()).not.toContain('Passo 1');

    setStepValue(0, 'Separar documentos');

    expect(host.steps.at(0).value).toBe('Separar documentos');
  });

  it('adds an empty step while preserving the previous value', () => {
    setStepValue(0, 'Primeiro passo');

    clickButton('+ Adicionar etapa');

    expect(host.steps.getRawValue()).toEqual(['Primeiro passo', '']);
    expect(getInputs()).toHaveLength(2);
    expect(getLabels()[1].textContent).toContain('Descrição da etapa 2');
    expect(getStepNumbers()).toEqual(['1', '2']);
  });

  it('removes only the selected step and renumbers the remaining items', () => {
    addSteps('Primeiro', 'Segundo', 'Terceiro');

    clickButton('Remover etapa 2');

    expect(host.steps.getRawValue()).toEqual(['Primeiro', 'Terceiro']);
    expect(getLabels().map((label) => label.textContent?.trim())).toEqual([
      'Descrição da etapa 1',
      'Descrição da etapa 2',
    ]);
  });

  it('does not allow removing the final remaining step', () => {
    expect(getButton('Remover etapa 1').disabled).toBe(true);

    getButton('Remover etapa 1').click();

    expect(host.steps.length).toBe(1);
  });

  it('moves controls up and down without losing values or control instances', () => {
    addSteps('Primeiro', 'Segundo', 'Terceiro');
    const firstControl = host.steps.at(0);
    const secondControl = host.steps.at(1);

    clickButton('Mover etapa 2 para cima');

    expect(host.steps.getRawValue()).toEqual(['Segundo', 'Primeiro', 'Terceiro']);
    expect(host.steps.at(0)).toBe(secondControl);
    expect(host.steps.at(1)).toBe(firstControl);

    clickButton('Mover etapa 1 para baixo');

    expect(host.steps.getRawValue()).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('disables impossible movements at the list boundaries', () => {
    addSteps('Primeiro', 'Segundo');

    expect(getButton('Mover etapa 1 para cima').disabled).toBe(true);
    expect(getButton('Mover etapa 2 para baixo').disabled).toBe(true);
  });

  it('provides contextual accessible labels for every action', () => {
    addSteps('Primeiro', 'Segundo');

    expect(getButton('Mover etapa 2 para cima')).toBeTruthy();
    expect(getButton('Mover etapa 1 para baixo')).toBeTruthy();
    expect(getButton('Remover etapa 2')).toBeTruthy();
  });

  it('keeps the number, accessible input and all action buttons inside one item', () => {
    const item = fixture.nativeElement.querySelector('.step-input__item') as HTMLElement;

    expect(item.querySelector('.step-input__number')?.textContent).toContain('1');
    expect(item.querySelector('.step-input__control')).toBe(getInputs()[0]);
    expect(item.querySelectorAll('.step-input__item-actions button')).toHaveLength(3);
    expect(getInputs()[0].placeholder).toBe('Descreva esta etapa');
  });

  it('renders an enabled danger delete action when more than one step exists', () => {
    addSteps('Primeiro', 'Segundo');

    const removeButton = getButton('Remover etapa 2');
    expect(removeButton.disabled).toBe(false);
    expect(removeButton.classList.contains('step-input__remove')).toBe(true);
    expect(removeButton.querySelector('ng-icon')?.getAttribute('name')).toBe(
      'matDeleteForeverRound',
    );
  });

  it('renders only the three registered SVG icons as decorative content', () => {
    const icons = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('ng-icon'));

    expect(icons.map((icon) => icon.getAttribute('name'))).toEqual([
      'matArrowUpwardRound',
      'matArrowDownwardRound',
      'matDeleteForeverRound',
    ]);
    expect(icons.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(fixture.nativeElement.querySelector('.step-input__item-actions img')).toBeNull();
    const forbiddenCharacters = [0x2191, 0x2193, 0x00d7, 0x1f5d1].map((codePoint) =>
      String.fromCodePoint(codePoint),
    );
    expect(forbiddenCharacters.every((character) => !getText().includes(character))).toBe(true);
  });

  it('renders the Figma add action at full width', () => {
    const addButton = getButton('+ Adicionar etapa');

    expect(addButton.classList.contains('button--full-width')).toBe(true);
    expect(fixture.nativeElement.querySelector('.step-input__add')).toBeTruthy();
  });

  it('disables editing and actions during submission', () => {
    addSteps('Primeiro', 'Segundo');
    host.disabled = true;
    fixture.detectChanges();

    expect(getInputs().every((input) => input.disabled)).toBe(true);
    expect(getButtons().every((button) => button.disabled)).toBe(true);
  });

  it('shows the associated field error only after the control is touched', () => {
    expect(getText()).not.toContain('Descreva esta etapa.');

    host.steps.at(0).markAsTouched();
    fixture.detectChanges();

    const input = getInputs()[0];
    const error = fixture.nativeElement.querySelector('.step-input__error') as HTMLElement;
    expect(error.textContent).toContain('Descreva esta etapa.');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('keeps generated input and error IDs unique', () => {
    addSteps('Primeiro', 'Segundo', '');
    host.steps.at(2).markAsTouched();
    fixture.detectChanges();
    const ids = Array.from(fixture.nativeElement.querySelectorAll('[id]')).map(
      (element: Element) => element.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  function addSteps(...values: string[]): void {
    host.steps.clear();
    values.forEach((value) => host.steps.push(createActivityStepControl(value)));
    fixture.detectChanges();
  }

  function setStepValue(index: number, value: string): void {
    const input = getInputs()[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    getButton(label).click();
    fixture.detectChanges();
  }

  function getButton(label: string): HTMLButtonElement {
    const button = getButtons().find(
      (candidate) =>
        candidate.getAttribute('aria-label') === label || candidate.textContent?.includes(label),
    );

    expect(button).toBeDefined();
    return button!;
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function getInputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.step-input__control'));
  }

  function getLabels(): HTMLLabelElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.step-input__field label'));
  }

  function getStepNumbers(): string[] {
    return Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.step-input__number'),
    ).map((number) => number.textContent?.trim() ?? '');
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }
});
