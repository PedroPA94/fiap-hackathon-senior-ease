import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ApplicationError, type Activity } from '@senior-ease/core';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ActivityService } from '../../../../../application/services/activity.service';
import { ThemeService } from '../../../../../application/services/theme.service';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { ActivityDetails } from './activity-details';

describe('ActivityDetails', () => {
  let activityService: ActivityServiceMock;
  let confirmCriticalActions: WritableSignal<boolean>;
  let enhancedFeedback: WritableSignal<boolean>;
  let fixture: ComponentFixture<ActivityDetails>;
  let interfaceMode: WritableSignal<'basic' | 'advanced'>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: Router;
  let themeService: ThemeServiceMock;
  let toastService: ToastServiceMock;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ activityId: 'activity-1' }));
    activityService = {
      getActivityById: vi.fn(() => of(makeActivity())),
      completeActivityStep: vi.fn(() => of(makeActivityWithCompletedFirstStep())),
      completeActivity: vi.fn(() => of(makeCompletedActivity())),
      deleteActivity: vi.fn(() => of(undefined)),
    };
    interfaceMode = signal<'basic' | 'advanced'>('advanced');
    enhancedFeedback = signal(true);
    confirmCriticalActions = signal(true);
    themeService = {
      interfaceMode,
      enhancedFeedback,
      confirmCriticalActions,
    };
    toastService = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ActivityDetails],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: ActivityService, useValue: activityService },
        { provide: ThemeService, useValue: themeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('loads the activity from the route ID once on initialization', () => {
    createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(activityService.getActivityById).toHaveBeenCalledOnce();
    expect(activityService.getActivityById).toHaveBeenCalledWith('activity-1');
  });

  it('shows only an accessible loading state while the request is pending', () => {
    const activitySubject = new Subject<Activity>();
    activityService.getActivityById.mockReturnValue(activitySubject.asObservable());

    createComponent();

    expect(getText()).toContain('Carregando atividade...');
    expect(fixture.nativeElement.querySelector('.activity-details').getAttribute('aria-busy')).toBe(
      'true',
    );
    expect(fixture.nativeElement.querySelector('.activity-details__actions')).toBeNull();
  });

  it('renders title, optional description, local date, time, status and progress', () => {
    createComponent();

    expect(getHeading(1).textContent).toContain('Consulta médica');
    expect(getText()).toContain('Levar os exames recentes');
    expect(getText()).toContain('20 de julho de 2026');
    expect(getText()).toContain('14:30');
    expect(getText()).toContain('Não iniciada');
    expect(getText()).toContain('0 de 2 etapas concluídas');
    const progress = fixture.nativeElement.querySelector('progress') as HTMLProgressElement;
    expect(progress.max).toBe(2);
    expect(progress.value).toBe(0);
    expect(progress.getAttribute('aria-valuetext')).toBe('0 de 2 etapas concluídas');
    expect(progress.getAttribute('aria-labelledby')).toBe('activity-progress-heading');
  });

  it('omits empty optional description and time without rendering placeholders', () => {
    activityService.getActivityById.mockReturnValue(
      of(makeActivity({ description: undefined, time: undefined })),
    );

    createComponent();

    expect(fixture.nativeElement.querySelector('.activity-details__heading p')).toBeNull();
    expect(getText()).not.toContain('Horário');
    expect(getText()).not.toContain('undefined');
  });

  it('orders steps through the core view and exposes completion only for the current step', () => {
    activityService.getActivityById.mockReturnValue(
      of(
        makeActivity({
          steps: [
            { id: 'step-2', description: 'Conversar com a médica', order: 2 },
            { id: 'step-1', description: 'Separar os exames', order: 1 },
          ],
        }),
      ),
    );

    createComponent();
    const items = getStepItems();

    expect(items[0].textContent).toContain('Separar os exames');
    expect(items[1].textContent).toContain('Conversar com a médica');
    expect(fixture.nativeElement.querySelectorAll('.activity-step-item__action')).toHaveLength(1);
    expect(items[0].textContent).toContain('Etapa atual');
    expect(items[1].textContent).toContain('Pendente');
  });

  it('completes the current step once, replaces the activity and shows feedback', () => {
    createComponent();

    clickPageButton('Concluir etapa');

    expect(activityService.completeActivityStep).toHaveBeenCalledOnce();
    expect(activityService.completeActivityStep).toHaveBeenCalledWith('activity-1', 'step-1');
    expect(getText()).toContain('1 de 2 etapas concluídas');
    expect(getStepItems()[0].textContent).toContain('Concluída');
    expect(getStepItems()[1].textContent).toContain('Etapa atual');
    expect(toastService.success).toHaveBeenCalledWith('Etapa concluída com sucesso.');
    expect(getText()).toContain('Etapa concluída com sucesso.');
  });

  it('keeps one step request active and disables conflicting actions', () => {
    const completionSubject = new Subject<Activity>();
    activityService.completeActivityStep.mockReturnValue(completionSubject.asObservable());
    createComponent();

    clickPageButton('Concluir etapa');
    clickPageButton('Concluir etapa');

    expect(activityService.completeActivityStep).toHaveBeenCalledOnce();
    expect(getPageButton('Concluir etapa').disabled).toBe(true);
    expect(getPageButton('Concluir atividade').disabled).toBe(true);
    expect(getPageButton('Excluir atividade').disabled).toBe(true);
  });

  it('preserves the activity and shows an inline error when step completion fails', () => {
    activityService.completeActivityStep.mockReturnValue(
      throwError(() => new Error('Completion failed')),
    );
    createComponent();

    clickPageButton('Concluir etapa');

    expect(getText()).toContain('0 de 2 etapas concluídas');
    expect(getText()).toContain('Não foi possível concluir a etapa. Tente novamente.');
    expect(toastService.success).not.toHaveBeenCalled();
  });

  it('completes the whole activity directly when confirmation is disabled', () => {
    confirmCriticalActions.set(false);
    enhancedFeedback.set(false);
    createComponent();

    clickPageButton('Concluir atividade');

    expect(activityService.completeActivity).toHaveBeenCalledOnce();
    expect(activityService.completeActivity).toHaveBeenCalledWith('activity-1');
    expect(getText()).toContain('Concluída');
    expect(getPageButtonOrNull('Concluir atividade')).toBeNull();
    expect(toastService.success).toHaveBeenCalledWith('Atividade concluída com sucesso.');
    expect(fixture.nativeElement.querySelector('.inline-alert--success')).toBeNull();
  });

  it('asks for confirmation before completing and cancellation does not call the service', () => {
    createComponent();

    clickPageButton('Concluir atividade');
    expect(getDialog().open).toBe(true);
    expect(getDialog().textContent).toContain('Todas as etapas serão marcadas como concluídas.');

    clickDialogButton('Cancelar');
    fixture.detectChanges();

    expect(activityService.completeActivity).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('keeps the confirmation modal while completing and submits only once', () => {
    const completion$ = new Subject<Activity>();
    activityService.completeActivity.mockReturnValue(completion$.asObservable());
    createComponent();

    clickPageButton('Concluir atividade');
    clickDialogButton('Concluir atividade');

    expect(activityService.completeActivity).toHaveBeenCalledOnce();
    expect(getDialog().open).toBe(true);
    expect(getDialogButtons().every((button) => button.disabled)).toBe(true);

    clickDialogButton('Concluir atividade');
    expect(activityService.completeActivity).toHaveBeenCalledOnce();

    completion$.next(makeCompletedActivity());
    completion$.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(getPageButtonOrNull('Concluir atividade')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.activity-step-item__action')).toHaveLength(0);
  });

  it('deletes directly without confirmation and navigates to the listing', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    confirmCriticalActions.set(false);
    createComponent();

    clickPageButton('Excluir atividade');

    expect(activityService.deleteActivity).toHaveBeenCalledOnce();
    expect(activityService.deleteActivity).toHaveBeenCalledWith('activity-1');
    expect(toastService.success).toHaveBeenCalledWith('Atividade excluída com sucesso.');
    expect(navigateSpy).toHaveBeenCalledWith(['/activities']);
    expect(activityService.getActivityById).toHaveBeenCalledOnce();
  });

  it('asks for confirmation before deletion', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    createComponent();

    clickPageButton('Excluir atividade');

    expect(getDialog().textContent).toContain('Essa atividade será removida da sua lista.');
    clickDialogButton('Excluir');

    expect(activityService.deleteActivity).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(['/activities']);
  });

  it('cancels deletion without calling the service', () => {
    createComponent();

    clickPageButton('Excluir atividade');
    clickDialogButton('Cancelar');

    expect(activityService.deleteActivity).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('keeps the page and allows retry after deletion fails', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    confirmCriticalActions.set(false);
    activityService.deleteActivity
      .mockReturnValueOnce(throwError(() => new Error('Deletion failed')))
      .mockReturnValueOnce(of(undefined));
    createComponent();

    clickPageButton('Concluir etapa');
    expect(getText()).toContain('Etapa concluída com sucesso.');

    clickPageButton('Excluir atividade');

    expect(getText()).toContain('Não foi possível excluir a atividade. Tente novamente.');
    expect(getText()).not.toContain('Etapa concluída com sucesso.');
    expect(navigateSpy).not.toHaveBeenCalled();

    clickPageButton('Excluir atividade');
    expect(activityService.deleteActivity).toHaveBeenCalledTimes(2);
  });

  it('renders a private not-found state without exposing the internal code', () => {
    activityService.getActivityById.mockReturnValue(
      throwError(() => new ApplicationError('ACTIVITY_NOT_FOUND')),
    );
    createComponent();

    expect(getHeading(1).textContent).toContain('Atividade não encontrada');
    expect(getText()).toContain('Ela pode ter sido removida ou não pertence ao usuário atual.');
    expect(getText()).not.toContain('ACTIVITY_NOT_FOUND');
  });

  it('shows a generic loading error and retries the current ID once', () => {
    activityService.getActivityById
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(of(makeActivity()));
    createComponent();

    expect(getText()).toContain('Não foi possível carregar esta atividade.');
    clickButton('Tentar novamente');

    expect(activityService.getActivityById).toHaveBeenCalledTimes(2);
    expect(getText()).toContain('Consulta médica');
  });

  it('does not call the service when activityId is absent', () => {
    paramMap$.next(convertToParamMap({}));

    createComponent();

    expect(activityService.getActivityById).not.toHaveBeenCalled();
    expect(getText()).toContain('Não foi possível carregar esta atividade.');
    expect(getText()).not.toContain('Tentar novamente');
  });

  it('cancels the previous load when the route ID changes and clears old data', () => {
    const firstActivity$ = new Subject<Activity>();
    const secondActivity$ = new Subject<Activity>();
    activityService.getActivityById
      .mockReturnValueOnce(firstActivity$.asObservable())
      .mockReturnValueOnce(secondActivity$.asObservable());
    createComponent();

    paramMap$.next(convertToParamMap({ activityId: 'activity-2' }));
    fixture.detectChanges();
    firstActivity$.next(makeActivity({ title: 'Atividade antiga' }));
    secondActivity$.next(makeActivity({ id: 'activity-2', title: 'Atividade nova' }));
    secondActivity$.complete();
    fixture.detectChanges();

    expect(activityService.getActivityById).toHaveBeenNthCalledWith(2, 'activity-2');
    expect(getText()).toContain('Atividade nova');
    expect(getText()).not.toContain('Atividade antiga');
  });

  it('ignores an operation result after the route ID changes', () => {
    const completion$ = new Subject<Activity>();
    activityService.getActivityById
      .mockReturnValueOnce(of(makeActivity()))
      .mockReturnValueOnce(of(makeActivity({ id: 'activity-2', title: 'Atividade nova' })));
    activityService.completeActivityStep.mockReturnValue(completion$.asObservable());
    createComponent();

    clickPageButton('Concluir etapa');
    paramMap$.next(convertToParamMap({ activityId: 'activity-2' }));
    fixture.detectChanges();
    completion$.next(makeActivityWithCompletedFirstStep());
    fixture.detectChanges();

    expect(getText()).toContain('Atividade nova');
    expect(getText()).not.toContain('Etapa concluída com sucesso.');
  });

  it('moves focus to the new current step after completing a step', async () => {
    createComponent();

    clickPageButton('Concluir etapa');
    await fixture.whenStable();

    expect(document.activeElement).toBe(getStepItems()[1]);
  });

  it('focuses enhanced feedback after completing the whole activity', async () => {
    confirmCriticalActions.set(false);
    createComponent();

    clickPageButton('Concluir atividade');
    await fixture.whenStable();

    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('se-inline-alert[tabindex="-1"]'),
    );
  });

  it('keeps one h1, coherent headings, named buttons and a named progress indicator', () => {
    createComponent();
    const headings = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('h2')).map(
      (heading) => heading.textContent?.trim(),
    );
    const progress = fixture.nativeElement.querySelector('progress') as HTMLProgressElement;
    const progressLabel = fixture.nativeElement.querySelector(
      `#${progress.getAttribute('aria-labelledby')}`,
    );

    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(headings).toEqual(['Progresso', 'Etapas', 'Ações']);
    expect(getButtons().every((button) => button.textContent?.trim() || button.ariaLabel)).toBe(
      true,
    );
    expect(progressLabel?.textContent).toBe('Progresso');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ActivityDetails);
    fixture.detectChanges();
  }

  function clickPageButton(text: string): void {
    getPageButton(text).click();
    fixture.detectChanges();
  }

  function clickDialogButton(text: string): void {
    const button = Array.from<HTMLButtonElement>(getDialog().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.includes(text),
    );
    expect(button).toBeDefined();
    button!.click();
    fixture.detectChanges();
  }

  function clickButton(text: string): void {
    const button = getButtons().find((candidate) => candidate.textContent?.includes(text));
    expect(button).toBeDefined();
    button!.click();
    fixture.detectChanges();
  }

  function getPageButton(text: string): HTMLButtonElement {
    const button = getPageButtonOrNull(text);
    expect(button).toBeTruthy();
    return button!;
  }

  function getPageButtonOrNull(text: string): HTMLButtonElement | null {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.activity-details__layout button'),
    );
    return buttons.find((button) => button.textContent?.includes(text)) ?? null;
  }

  function getButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function getDialog(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  function getDialogButtons(): HTMLButtonElement[] {
    return Array.from(getDialog().querySelectorAll('button'));
  }

  function getHeading(level: number): HTMLElement {
    return fixture.nativeElement.querySelector(`h${level}`);
  }

  function getStepItems(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.activity-step-item'));
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }
});

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Consulta médica',
    description: 'Levar os exames recentes',
    date: '2026-07-20',
    time: '14:30',
    steps: [
      { id: 'step-1', description: 'Separar os exames', order: 1 },
      { id: 'step-2', description: 'Conversar com a médica', order: 2 },
    ],
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}

function makeActivityWithCompletedFirstStep(): Activity {
  return makeActivity({
    steps: [
      {
        id: 'step-1',
        description: 'Separar os exames',
        order: 1,
        completedAt: '2026-07-20T11:00:00.000Z',
      },
      { id: 'step-2', description: 'Conversar com a médica', order: 2 },
    ],
    updatedAt: '2026-07-20T11:00:00.000Z',
  });
}

function makeCompletedActivity(): Activity {
  const completedAt = '2026-07-20T11:00:00.000Z';
  return makeActivity({
    steps: makeActivity().steps.map((step) => ({ ...step, completedAt })),
    updatedAt: completedAt,
  });
}

type ActivityServiceMock = {
  getActivityById: Mock<(activityId: string) => Observable<Activity>>;
  completeActivityStep: Mock<(activityId: string, stepId: string) => Observable<Activity>>;
  completeActivity: Mock<(activityId: string) => Observable<Activity>>;
  deleteActivity: Mock<(activityId: string) => Observable<void>>;
};

type ThemeServiceMock = Pick<
  ThemeService,
  'interfaceMode' | 'enhancedFeedback' | 'confirmCriticalActions'
>;

type ToastServiceMock = {
  success: Mock<(message: string) => void>;
};
