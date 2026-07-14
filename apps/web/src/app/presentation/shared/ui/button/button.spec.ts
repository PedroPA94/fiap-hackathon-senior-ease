import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Button, type ButtonType, type ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `
    <se-button
      [variant]="variant"
      [type]="type"
      [disabled]="disabled"
      [loading]="loading"
      [fullWidth]="fullWidth"
      [ariaLabel]="ariaLabel"
    >
      Salvar
    </se-button>
  `,
})
class ButtonHost {
  variant: ButtonVariant = 'primary';
  type: ButtonType = 'button';
  disabled = false;
  loading = false;
  fullWidth = true;
  ariaLabel: string | null = null;
}

describe('Button', () => {
  let fixture: ComponentFixture<ButtonHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonHost);
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render projected content and default attributes', () => {
    fixture.detectChanges();

    const buttonElement = getButtonElement();

    expect(buttonElement.textContent).toContain('Salvar');
    expect(buttonElement.type).toBe('button');
    expect(buttonElement.classList.contains('button--primary')).toBe(true);
    expect(buttonElement.classList.contains('button--full-width')).toBe(true);
    expect(buttonElement.disabled).toBe(false);
  });

  it('should apply variant, type and aria label inputs', () => {
    fixture.componentInstance.variant = 'danger-outline';
    fixture.componentInstance.type = 'submit';
    fixture.componentInstance.ariaLabel = 'Salvar alteracoes';
    fixture.detectChanges();

    const buttonElement = getButtonElement();

    expect(buttonElement.classList.contains('button--danger-outline')).toBe(true);
    expect(buttonElement.type).toBe('submit');
    expect(buttonElement.getAttribute('aria-label')).toBe('Salvar alteracoes');
  });

  it('should disable the button when disabled', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();

    expect(getButtonElement().disabled).toBe(true);
  });

  it('should render loading state and hide visible content', () => {
    fixture.componentInstance.loading = true;
    fixture.detectChanges();

    const buttonElement = getButtonElement();
    const spinner = fixture.nativeElement.querySelector('.button__spinner');
    const content = fixture.nativeElement.querySelector('.button__content');

    expect(buttonElement.disabled).toBe(true);
    expect(buttonElement.classList.contains('button--loading')).toBe(true);
    expect(buttonElement.getAttribute('aria-busy')).toBe('true');
    expect(spinner).toBeTruthy();
    expect(content.classList.contains('button__content--hidden')).toBe(true);
    expect(buttonElement.textContent).toContain('Carregando');
  });

  it('should not apply full width class when fullWidth is false', () => {
    fixture.componentInstance.fullWidth = false;
    fixture.detectChanges();

    expect(getButtonElement().classList.contains('button--full-width')).toBe(false);
  });

  function getButtonElement(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }
});
