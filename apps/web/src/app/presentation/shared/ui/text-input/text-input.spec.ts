import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { TextInput, type TextInputType } from './text-input';

@Component({
  imports: [TextInput],
  template: `
    <se-text-input
      [inputId]="inputId"
      [label]="label"
      [type]="type"
      [placeholder]="placeholder"
      [hint]="hint"
      [errorMessage]="errorMessage"
      [required]="required"
      [autofocus]="autofocus"
      [invalid]="invalid"
      [name]="name"
      [maxLength]="maxLength"
    />
  `,
})
class TextInputHost {
  inputId = 'name';
  label = 'Nome';
  type: TextInputType = 'text';
  placeholder = 'Digite seu nome';
  hint: string | null = 'Informe o nome completo';
  errorMessage: string | null = null;
  required = false;
  autofocus = false;
  invalid = false;
  name: string | null = 'name';
  maxLength: number | null = 80;
}

@Component({
  imports: [FormsModule, TextInput],
  template: `
    <se-text-input
      inputId="profile-name"
      label="Nome"
      name="profileName"
      [(ngModel)]="value"
    />
  `,
})
class TextInputFormsHost {
  value = 'Maria';
}

describe('TextInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextInputHost, TextInputFormsHost],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TextInputHost);

    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render label, input attributes and hint', () => {
    const fixture = TestBed.createComponent(TextInputHost);

    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = getInputElement(fixture);
    const hint = fixture.nativeElement.querySelector('.text-input__message') as HTMLElement;

    expect(label.textContent).toContain('Nome');
    expect(label.htmlFor).toBe('name');
    expect(input.id).toBe('name');
    expect(input.name).toBe('name');
    expect(input.type).toBe('text');
    expect(input.placeholder).toBe('Digite seu nome');
    expect(input.getAttribute('maxlength')).toBe('80');
    expect(input.getAttribute('aria-describedby')).toBe('name-hint');
    expect(hint.id).toBe('name-hint');
    expect(hint.textContent).toContain('Informe o nome completo');
  });

  it('should render required state', () => {
    const fixture = TestBed.createComponent(TextInputHost);
    fixture.componentInstance.required = true;

    fixture.detectChanges();

    const input = getInputElement(fixture);

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Campo obrigatório');
  });

  it('should forward the initial autofocus preference to the native input', () => {
    const fixture = TestBed.createComponent(TextInputHost);
    fixture.componentInstance.autofocus = true;

    fixture.detectChanges();

    expect(getInputElement(fixture).autofocus).toBe(true);
  });

  it('should render invalid state with error message', () => {
    const fixture = TestBed.createComponent(TextInputHost);
    fixture.componentInstance.invalid = true;
    fixture.componentInstance.errorMessage = 'Nome obrigatorio';

    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.text-input') as HTMLElement;
    const input = getInputElement(fixture);
    const error = fixture.nativeElement.querySelector('.text-input__message--error') as HTMLElement;

    expect(wrapper.classList.contains('text-input--invalid')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('name-error');
    expect(error.id).toBe('name-error');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Nome obrigatorio');
  });

  it('should update value and touched state through ControlValueAccessor callbacks', () => {
    const fixture = TestBed.createComponent(TextInputHost);
    fixture.detectChanges();

    const textInput = fixture.debugElement.children[0].componentInstance as TextInput;
    const onChange = vi.fn<(value: string) => void>();
    const onTouched = vi.fn<() => void>();
    const input = getInputElement(fixture);

    textInput.registerOnChange(onChange);
    textInput.registerOnTouched(onTouched);

    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(onChange).toHaveBeenCalledWith('Ana');
    expect(onTouched).toHaveBeenCalledOnce();
    expect(input.value).toBe('Ana');
  });

  it('should write values and disabled state through ControlValueAccessor', () => {
    const fixture = TestBed.createComponent(TextInputHost);
    fixture.detectChanges();

    const textInput = fixture.debugElement.children[0].componentInstance as TextInput;

    textInput.writeValue('Maria');
    textInput.setDisabledState(true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.text-input') as HTMLElement;
    const input = getInputElement(fixture);

    expect(input.value).toBe('Maria');
    expect(input.disabled).toBe(true);
    expect(wrapper.classList.contains('text-input--disabled')).toBe(true);
  });

  it('should integrate with ngModel', async () => {
    const fixture = TestBed.createComponent(TextInputFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = getInputElement(fixture);

    expect(input.value).toBe('Maria');

    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('Ana');
  });

  function getInputElement(fixture: ComponentFixture<unknown>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }
});
