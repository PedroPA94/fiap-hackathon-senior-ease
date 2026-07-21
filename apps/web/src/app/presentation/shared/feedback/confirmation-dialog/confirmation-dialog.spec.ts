import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  let fixture: ComponentFixture<ConfirmationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmationDialog] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationDialog);
    fixture.componentRef.setInput('title', 'Excluir atividade?');
    fixture.componentRef.setInput('description', 'Essa atividade será removida da sua lista.');
    fixture.componentRef.setInput('confirmLabel', 'Excluir');
    fixture.detectChanges();
  });

  it('renders an accessible modal with associated title and description', () => {
    const dialog = getDialog();

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(
      fixture.nativeElement.querySelector('h2').id,
    );
    expect(dialog.getAttribute('aria-describedby')).toBe(
      fixture.nativeElement.querySelector('p').id,
    );
    expect(getText()).toContain('Excluir atividade?');
    expect(getText()).toContain('Essa atividade será removida da sua lista.');
  });

  it('emits cancellation from its named button', () => {
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);

    getButton('Cancelar').click();

    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('emits confirmation from its named button', () => {
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    getButton('Excluir').click();

    expect(confirmed).toHaveBeenCalledOnce();
  });

  it('applies danger treatment when requested', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();

    expect(getDialog().classList.contains('confirmation-dialog--danger')).toBe(true);
    expect(getButton('Excluir').classList.contains('button--danger')).toBe(true);
  });

  it('disables both actions and does not confirm while processing', () => {
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentRef.setInput('processing', true);
    fixture.detectChanges();

    expect(getButtons().every((button) => button.disabled)).toBe(true);
    getButton('Excluir').click();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('handles Escape as cancellation', () => {
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);

    getDialog().dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('returns focus to the element active before opening', async () => {
    fixture.destroy();
    await Promise.resolve();

    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    fixture = TestBed.createComponent(ConfirmationDialog);
    fixture.componentRef.setInput('title', 'Excluir atividade?');
    fixture.componentRef.setInput('description', 'Essa atividade será removida da sua lista.');
    fixture.detectChanges();
    fixture.destroy();
    await Promise.resolve();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  function getDialog(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  function getButton(text: string): HTMLButtonElement {
    return getButtons().find((button) => button.textContent?.includes(text))!;
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }
});
