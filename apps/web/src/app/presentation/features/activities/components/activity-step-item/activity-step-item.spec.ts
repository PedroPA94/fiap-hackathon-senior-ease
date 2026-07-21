import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ActivityStepView } from '@senior-ease/core';

import { ActivityStepItem } from './activity-step-item';

describe('ActivityStepItem', () => {
  let fixture: ComponentFixture<ActivityStepItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActivityStepItem] }).compileComponents();
    fixture = TestBed.createComponent(ActivityStepItem);
  });

  it('renders completed state with a decorative rounded check and no action', () => {
    render(makeStep('completed'));

    expect(getText()).toContain('Concluída');
    expect(getIcon()?.getAttribute('name')).toBe('matCheckRound');
    expect(getIcon()?.getAttribute('aria-hidden')).toBe('true');
    expect(getButton()).toBeNull();
  });

  it('renders only the current step with a completion action', () => {
    render(makeStep('current'));

    expect(getText()).toContain('Etapa atual');
    expect(getButton()?.textContent).toContain('Concluir etapa');
    expect(fixture.nativeElement.querySelector('[aria-current="step"]')).toBeTruthy();
    expect(getIcon()).toBeNull();
  });

  it('renders a pending step with visible status and no action', () => {
    render(makeStep('pending'));

    expect(getText()).toContain('Pendente');
    expect(getText()).toContain('2');
    expect(getButton()).toBeNull();
  });

  it('emits the current step ID when completion is requested', () => {
    const completionRequested = vi.fn();
    fixture.componentInstance.completionRequested.subscribe(completionRequested);
    render(makeStep('current'));

    getButton()?.click();

    expect(completionRequested).toHaveBeenCalledOnce();
    expect(completionRequested).toHaveBeenCalledWith('step-1');
  });

  it('shows loading and blocks completion while processing', () => {
    const completionRequested = vi.fn();
    fixture.componentInstance.completionRequested.subscribe(completionRequested);
    fixture.componentRef.setInput('loading', true);
    render(makeStep('current'));

    expect(getButton()?.disabled).toBe(true);
    expect(getButton()?.getAttribute('aria-busy')).toBe('true');
    getButton()?.click();
    expect(completionRequested).not.toHaveBeenCalled();
  });

  it('blocks completion when another activity action is running', () => {
    fixture.componentRef.setInput('actionsDisabled', true);
    render(makeStep('current'));

    expect(getButton()?.disabled).toBe(true);
  });

  it('focuses its semantic container when requested by the page', () => {
    render(makeStep('current'));

    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('article'));
  });

  it('does not render improvised Unicode action symbols', () => {
    render(makeStep('current'));
    const forbiddenCharacters = [0x2191, 0x2193, 0x00d7, 0x1f5d1].map((codePoint) =>
      String.fromCodePoint(codePoint),
    );

    expect(forbiddenCharacters.every((character) => !getText().includes(character))).toBe(true);
  });

  function render(step: ActivityStepView): void {
    fixture.componentRef.setInput('step', step);
    fixture.componentRef.setInput('position', 2);
    fixture.detectChanges();
  }

  function getButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button');
  }

  function getIcon(): HTMLElement | null {
    return fixture.nativeElement.querySelector('ng-icon');
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }
});

function makeStep(viewStatus: ActivityStepView['viewStatus']): ActivityStepView {
  return {
    id: 'step-1',
    description: 'Separar os documentos',
    order: 1,
    ...(viewStatus === 'completed' ? { completedAt: '2026-07-20T10:00:00.000Z' } : {}),
    viewStatus,
  };
}
