import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InlineAlert, type InlineAlertVariant } from './inline-alert';

@Component({
  imports: [InlineAlert],
  template: `
    <se-inline-alert [variant]="variant">
      <p class="projected-content">{{ message }}</p>
    </se-inline-alert>
  `,
})
class InlineAlertHost {
  variant: InlineAlertVariant = 'info';
  message = 'Nao foi possivel carregar suas preferencias.';
}

describe('InlineAlert', () => {
  let fixture: ComponentFixture<InlineAlertHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineAlertHost],
    }).compileComponents();

    fixture = TestBed.createComponent(InlineAlertHost);
  });

  it('should create without service providers', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(getAlertElement()).toBeTruthy();
  });

  it('should project content', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected-content')?.textContent).toContain(
      'Nao foi possivel carregar suas preferencias.',
    );
  });

  it('should use the info variant by default', () => {
    fixture.detectChanges();

    expect(getAlertElement().classList.contains('inline-alert--info')).toBe(true);
  });

  it.each([
    ['error', 'inline-alert--error'],
    ['success', 'inline-alert--success'],
    ['info', 'inline-alert--info'],
  ] as const)('should apply the %s variant class', (variant, expectedClass) => {
    fixture.componentInstance.variant = variant;

    fixture.detectChanges();

    expect(getAlertElement().classList.contains(expectedClass)).toBe(true);
  });

  it('should expose assertive alert semantics for errors', () => {
    fixture.componentInstance.variant = 'error';

    fixture.detectChanges();

    expect(getAlertElement().getAttribute('role')).toBe('alert');
    expect(getAlertElement().getAttribute('aria-live')).toBe('assertive');
    expect(getAlertElement().getAttribute('aria-atomic')).toBe('true');
  });

  it.each(['success', 'info'] as const)(
    'should expose polite status semantics for %s messages',
    (variant) => {
      fixture.componentInstance.variant = variant;

      fixture.detectChanges();

      expect(getAlertElement().getAttribute('role')).toBe('status');
      expect(getAlertElement().getAttribute('aria-live')).toBe('polite');
      expect(getAlertElement().getAttribute('aria-atomic')).toBe('true');
    },
  );

  it('should preserve long textual content', () => {
    const longMessage =
      'Esta mensagem longa explica em detalhes que as preferencias de acessibilidade nao puderam ser carregadas e orienta a pessoa a tentar novamente mais tarde.';
    fixture.componentInstance.message = longMessage;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.inline-alert__content')?.textContent).toContain(
      longMessage,
    );
  });

  it('should not render a close button', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  function getAlertElement(): HTMLElement {
    return fixture.nativeElement.querySelector('.inline-alert')!;
  }
});
