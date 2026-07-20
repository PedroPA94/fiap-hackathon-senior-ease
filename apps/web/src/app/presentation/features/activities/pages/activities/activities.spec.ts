import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import type { Activity, ActivityListFilter } from '@senior-ease/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ActivityService } from '../../../../../application/services/activity.service';
import { Activities } from './activities';

describe('Activities', () => {
  let activityService: ActivityServiceMock;
  let fixture: ComponentFixture<Activities>;

  beforeEach(async () => {
    activityService = {
      listActivities: vi.fn(() => of([makeActivity()])),
    };

    await TestBed.configureTestingModule({
      imports: [Activities],
      providers: [provideRouter([]), { provide: ActivityService, useValue: activityService }],
    }).compileComponents();
  });

  it('creates and loads the default filter exactly once', () => {
    createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(activityService.listActivities).toHaveBeenCalledOnce();
    expect(activityService.listActivities).toHaveBeenCalledWith('all');
  });

  it('shows an accessible loading state and ends it after success', () => {
    const activitiesSubject = new Subject<Activity[]>();
    activityService.listActivities.mockReturnValue(activitiesSubject.asObservable());
    createComponent();

    expect(getText()).toContain('Carregando atividades...');
    expect(getResults().getAttribute('aria-busy')).toBe('true');

    activitiesSubject.next([makeActivity({ title: 'Consulta médica' })]);
    activitiesSubject.complete();
    fixture.detectChanges();

    expect(getText()).not.toContain('Carregando atividades...');
    expect(getResults().getAttribute('aria-busy')).toBe('false');
    expect(getText()).toContain('Consulta médica');
  });

  it('clears stale activities and shows a retryable inline error', () => {
    activityService.listActivities.mockReturnValue(throwError(() => new Error('Failed')));
    createComponent();

    expect(getText()).toContain('Não foi possível carregar suas atividades.');
    expect(getText()).toContain('Tentar novamente');
    expect(fixture.nativeElement.querySelectorAll('se-activity-list-item')).toHaveLength(0);
    expect(getResults().getAttribute('aria-busy')).toBe('false');
  });

  it('retries with the currently selected filter', () => {
    activityService.listActivities
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(throwError(() => new Error('Failed')))
      .mockReturnValueOnce(of([]));
    createComponent();

    selectFilter('today');
    getRetryAction()?.click();
    fixture.detectChanges();

    expect(activityService.listActivities).toHaveBeenNthCalledWith(2, 'today');
    expect(activityService.listActivities).toHaveBeenNthCalledWith(3, 'today');
  });

  it('does not start concurrent retries', () => {
    const retrySubject = new Subject<Activity[]>();
    activityService.listActivities
      .mockReturnValueOnce(throwError(() => new Error('Failed')))
      .mockReturnValueOnce(retrySubject.asObservable());
    createComponent();
    const retryAction = getRetryAction();

    retryAction?.click();
    retryAction?.click();

    expect(activityService.listActivities).toHaveBeenCalledTimes(2);
  });

  it('renders the general empty state with an accessible creation action', () => {
    activityService.listActivities.mockReturnValue(of([]));
    createComponent();

    expect(getText()).toContain('Você ainda não criou nenhuma atividade.');
    expect(getRouterLinkByText('Criar atividade').urlTree!.toString()).toBe('/activities/new');
  });

  const filteredEmptyStates: ReadonlyArray<readonly [ActivityListFilter, string]> = [
    ['today', 'Você não possui atividades para hoje.'],
    ['pending', 'Você não possui atividades não iniciadas.'],
    ['inProgress', 'Você não possui atividades em andamento.'],
    ['completed', 'Você ainda não concluiu nenhuma atividade.'],
  ];

  it.each(filteredEmptyStates)('renders the specific empty state for %s', (filter, message) => {
    activityService.listActivities.mockReturnValue(of([]));
    createComponent();

    selectFilter(filter);

    expect(getText()).toContain(message);
    expect(activityService.listActivities).toHaveBeenLastCalledWith(filter);
  });

  it('maps every visual filter to the core filter value', () => {
    createComponent();

    selectFilter('inProgress');

    expect(activityService.listActivities).toHaveBeenLastCalledWith('inProgress');
  });

  it('cancels the previous load when the filter changes', () => {
    const unsubscribeSpy = vi.fn();
    const initialLoad = new Observable<Activity[]>(() => {
      return () => unsubscribeSpy();
    });
    activityService.listActivities.mockReturnValueOnce(initialLoad).mockReturnValueOnce(of([]));
    createComponent();

    selectFilter('completed');

    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });

  it('points the primary action to the creation route', () => {
    createComponent();

    expect(getRouterLinkByText('Nova atividade').urlTree!.toString()).toBe('/activities/new');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Activities);
    fixture.detectChanges();
  }

  function selectFilter(filter: ActivityListFilter): void {
    const input: HTMLInputElement | null = fixture.nativeElement.querySelector(
      `input[value="${filter}"]`,
    );

    input?.click();
    fixture.detectChanges();
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }

  function getResults(): HTMLElement {
    return fixture.nativeElement.querySelector('.activities__results')!;
  }

  function getRetryAction(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.inline-alert__action-message');
  }

  function getRouterLinkByText(text: string): RouterLink {
    const linkDebugElement = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .find((debugElement) => debugElement.nativeElement.textContent?.includes(text));

    expect(linkDebugElement).toBeDefined();

    return linkDebugElement!.injector.get(RouterLink);
  }
});

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Caminhada',
    date: '2026-07-20',
    steps: [{ id: 'step-1', description: 'Calçar os tênis', order: 1 }],
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}

type ActivityServiceMock = {
  listActivities: Mock<(filter?: ActivityListFilter) => Observable<Activity[]>>;
};
