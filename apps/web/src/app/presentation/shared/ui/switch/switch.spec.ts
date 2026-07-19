import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Switch } from './switch';

@Component({
  imports: [ReactiveFormsModule, Switch],
  template: `
    <se-switch
      inputId="enhanced-feedback"
      label="Feedback visual reforçado"
      [formControl]="control"
    />
  `,
})
class SwitchHost {
  readonly control = new FormControl(false, {
    nonNullable: true,
  });
}

describe('Switch', () => {
  let fixture: ComponentFixture<SwitchHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchHost],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchHost);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(getSwitch()).toBeTruthy();
  });

  it('should render an associated visible label and native switch input', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = getInput();

    expect(label.textContent).toContain('Feedback visual reforçado');
    expect(label.htmlFor).toBe('enhanced-feedback');
    expect(input.id).toBe('enhanced-feedback');
    expect(input.type).toBe('checkbox');
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(getComputedStyle(input).display).not.toBe('none');
  });

  it('should render false as unchecked and true as checked', () => {
    expect(getInput().checked).toBe(false);

    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();

    expect(getInput().checked).toBe(true);

    fixture.componentInstance.control.setValue(false);
    fixture.detectChanges();

    expect(getInput().checked).toBe(false);
  });

  it('should update the FormControl when clicked', () => {
    getInput().click();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe(true);
    expect(getInput().checked).toBe(true);
  });

  it('should mark the FormControl as touched only after blur', () => {
    const input = getInput();

    input.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.control.touched).toBe(false);

    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('should not call onChange when writeValue updates the value', () => {
    const switchComponent = getSwitch();
    const onChange = vi.fn<(checked: boolean) => void>();

    switchComponent.registerOnChange(onChange);
    switchComponent.writeValue(true);
    fixture.detectChanges();

    expect(onChange).not.toHaveBeenCalled();
    expect(getInput().checked).toBe(true);
  });

  it('should treat null and undefined values as false', () => {
    const switchComponent = getSwitch();

    switchComponent.writeValue(true);
    switchComponent.writeValue(null);
    fixture.detectChanges();

    expect(getInput().checked).toBe(false);

    switchComponent.writeValue(true);
    switchComponent.writeValue(undefined);
    fixture.detectChanges();

    expect(getInput().checked).toBe(false);
  });

  function getSwitch(): Switch {
    return fixture.debugElement.children[0].componentInstance as Switch;
  }

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }
});
