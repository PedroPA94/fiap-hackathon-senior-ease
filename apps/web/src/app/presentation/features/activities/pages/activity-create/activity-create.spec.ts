import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { DomainError, type Activity } from '@senior-ease/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import {
  ActivityService,
  type CreateCurrentUserActivityInput,
} from '../../../../../application/services/activity.service';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { ActivityCreate } from './activity-create';

describe('ActivityCreate', () => {
  let activityService: ActivityServiceMock;
  let fixture: ComponentFixture<ActivityCreate>;
  let router: Router;
  let toastService: ToastServiceMock;

  beforeEach(async () => {
    activityService = { createActivity: vi.fn(() => of(makeActivity())) };
    toastService = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ActivityCreate],
      providers: [
        provideRouter([]),
        { provide: ActivityService, useValue: activityService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('creates the complete form with its heading, description and one empty step', () => {
    createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(getText()).toContain('Nova atividade');
    expect(getText()).toContain('Crie uma atividade com etapas guiadas.');
    expect(getText()).not.toContain('Dados da atividade');
    expect(getText()).toContain('Etapas da atividade');
    expect(getInputs('.step-input__control')).toHaveLength(1);
    expect(getInputs('.step-input__control')[0].value).toBe('');
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
  });

  it('shows title, date and step validation only after submitting', () => {
    createComponent();

    expect(getText()).not.toContain('Digite um nome para a atividade.');
    expect(getText()).not.toContain('Escolha uma data para a atividade.');
    expect(getText()).not.toContain('Descreva esta etapa.');

    submitForm();

    expect(getText()).toContain('Digite um nome para a atividade.');
    expect(getText()).toContain('Escolha uma data para a atividade.');
    expect(getText()).toContain('Descreva esta etapa.');
    expect(activityService.createActivity).not.toHaveBeenCalled();
  });

  it('submits only normalized creation data in the visual step order', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    createComponent();
    fillRequiredFields();
    setInput('#activity-description', '  Levar documentos originais  ');
    setInput('#activity-time', '14:30');
    clickButton('+ Adicionar etapa');
    setInput('#activity-step-1', '  Conferir documentos  ');
    clickButtonByAriaLabel('Mover etapa 2 para cima');

    submitForm();

    expect(activityService.createActivity).toHaveBeenCalledOnce();
    expect(activityService.createActivity).toHaveBeenCalledWith({
      title: 'Enviar documentos',
      description: 'Levar documentos originais',
      date: '2026-07-20',
      time: '14:30',
      steps: ['Conferir documentos', 'Separar documentos'],
    });
  });

  it('converts empty optional strings to undefined', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    createComponent();
    fillRequiredFields();

    submitForm();

    expect(activityService.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ description: undefined, time: undefined }),
    );
  });

  it('prevents concurrent submissions and exposes the loading state', () => {
    const creationSubject = new Subject<Activity>();
    activityService.createActivity.mockReturnValue(creationSubject.asObservable());
    createComponent();
    fillRequiredFields();

    submitForm();
    submitForm();

    expect(activityService.createActivity).toHaveBeenCalledOnce();
    expect(getForm().getAttribute('aria-busy')).toBe('true');
    expect(getButton('Salvar atividade').getAttribute('aria-busy')).toBe('true');
    expect(getInputs('input, textarea').every((input) => input.disabled)).toBe(true);
  });

  it('shows success feedback and navigates using the returned activity ID', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    activityService.createActivity.mockReturnValue(of(makeActivity({ id: 'created-activity' })));
    createComponent();
    fillRequiredFields();

    submitForm();

    expect(toastService.success).toHaveBeenCalledWith('Atividade criada com sucesso.');
    expect(navigateSpy).toHaveBeenCalledWith(['/activities', 'created-activity']);
  });

  it('preserves values, stays on the page and shows an inline fallback error', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    activityService.createActivity.mockReturnValue(throwError(() => new Error('Failed')));
    createComponent();
    fillRequiredFields();

    submitForm();

    expect(getInput('#activity-title').value).toBe('  Enviar documentos  ');
    expect(getText()).toContain(
      'Não foi possível criar a atividade. Revise os dados e tente novamente.',
    );
    expect(getForm().getAttribute('aria-busy')).toBe('false');
    expect(toastService.success).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('uses the core catalog for known domain errors', () => {
    activityService.createActivity.mockReturnValue(
      throwError(() => new DomainError('ACTIVITY_STEP_DESCRIPTION_REQUIRED')),
    );
    createComponent();
    fillRequiredFields();

    submitForm();

    expect(getText()).toContain('Descreva o que deve ser feito neste passo.');
  });

  it('points Cancelar to the activities listing', () => {
    createComponent();
    const cancelDebugElement = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .find((element) => element.nativeElement.textContent?.includes('Cancelar'));

    expect(cancelDebugElement?.injector.get(RouterLink).urlTree?.toString()).toBe('/activities');
    expect(
      cancelDebugElement
        ?.query(By.css('button'))
        .nativeElement.classList.contains('button--danger-outline'),
    ).toBe(true);
  });

  it('renders the fields in the Figma order with the corrected labels', () => {
    createComponent();
    const details = fixture.nativeElement.querySelector('.activity-create__details');
    const title = details.querySelector('#activity-title') as HTMLElement;
    const schedule = details.querySelector('.activity-create__schedule') as HTMLElement;
    const description = details.querySelector('#activity-description') as HTMLElement;

    expect(
      title.compareDocumentPosition(schedule) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      schedule.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(details.textContent).toContain('Título');
    expect(details.textContent).toContain('Data');
    expect(details.textContent).toContain('Hora (opcional)');
    expect(details.textContent).toContain('Descrição (opcional)');
    expect(getButton('Salvar atividade')).toBeTruthy();
  });

  it('marks only title and date as visually required', () => {
    createComponent();
    const titleField = getInput('#activity-title').closest('se-text-input')!;
    const dateField = getInput('#activity-date').closest('se-text-input')!;
    const timeField = getInput('#activity-time').closest('se-text-input')!;
    const descriptionLabel = fixture.nativeElement.querySelector(
      'label[for="activity-description"]',
    ) as HTMLLabelElement;

    expect(titleField.querySelector('.text-input__required')).toBeTruthy();
    expect(dateField.querySelector('.text-input__required')).toBeTruthy();
    expect(timeField.querySelector('.text-input__required')).toBeNull();
    expect(descriptionLabel.textContent).toBe('Descrição (opcional)');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ActivityCreate);
    fixture.detectChanges();
  }

  function fillRequiredFields(): void {
    setInput('#activity-title', '  Enviar documentos  ');
    setInput('#activity-date', '2026-07-20');
    setInput('#activity-step-0', '  Separar documentos  ');
  }

  function setInput(selector: string, value: string): void {
    const input = getInput(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    getForm().dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function clickButton(text: string): void {
    getButton(text).click();
    fixture.detectChanges();
  }

  function clickButtonByAriaLabel(label: string): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    );
    button.click();
    fixture.detectChanges();
  }

  function getButton(text: string): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const button = buttons.find((candidate) => candidate.textContent?.includes(text));
    expect(button).toBeDefined();
    return button!;
  }

  function getForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form');
  }

  function getInput(selector: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(selector);
  }

  function getInputs(selector: string): Array<HTMLInputElement | HTMLTextAreaElement> {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }
});

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Enviar documentos',
    date: '2026-07-20',
    steps: [{ id: 'step-1', description: 'Separar documentos', order: 1 }],
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}

type ActivityServiceMock = {
  createActivity: Mock<(input: CreateCurrentUserActivityInput) => Observable<Activity>>;
};

type ToastServiceMock = {
  success: Mock<(message: string) => void>;
};
