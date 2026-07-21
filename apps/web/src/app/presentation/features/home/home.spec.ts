import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import type { Activity, HomeActivityOverview } from '@senior-ease/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ActivityService } from '../../../application/services/activity.service';
import { ThemeService } from '../../../application/services/theme.service';
import { Home } from './home';

describe('Home', () => {
  let activityService: ActivityServiceMock;
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    activityService = {
      getHomeOverview: vi.fn(() => of(makeOverview())),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: ActivityService, useValue: activityService },
        {
          provide: ThemeService,
          useValue: { interfaceMode: signal<'basic' | 'advanced'>('advanced') },
        },
      ],
    }).compileComponents();
  });

  it('creates and loads the overview once on initialization', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(activityService.getHomeOverview).toHaveBeenCalledOnce();
  });

  it('shows one loading state while the overview request is pending', () => {
    const overviewSubject = new Subject<HomeActivityOverview>();
    activityService.getHomeOverview.mockReturnValue(overviewSubject.asObservable());

    createComponent();

    expect(getText()).toContain('Carregando dados da página inicial...');
    expect(getContentRegion().getAttribute('aria-busy')).toBe('true');
    expect(activityService.getHomeOverview).toHaveBeenCalledOnce();
  });

  it('ends loading and renders the overview when loading succeeds', () => {
    const overviewSubject = new Subject<HomeActivityOverview>();
    activityService.getHomeOverview.mockReturnValue(overviewSubject.asObservable());
    createComponent();

    overviewSubject.next(makeOverview());
    overviewSubject.complete();
    fixture.detectChanges();

    expect(getText()).not.toContain('Carregando dados da página inicial...');
    expect(getContentRegion().getAttribute('aria-busy')).toBe('false');
    expect(getText()).toContain('Consulta médica');
  });

  it('renders the next activity title, date and time without static prototype data', () => {
    createComponent();

    expect(getText()).toContain('Consulta médica');
    expect(getText()).toContain('20/07/2026, 14:00');
    expect(getText()).toContain('Ver etapas');
    expect(getText()).not.toContain('Enviar documento para secretaria');
  });

  it('links Ver etapas to the real next activity ID', () => {
    createComponent();
    const link = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .find((element) => element.nativeElement.textContent?.includes('Ver etapas'));

    expect(link?.injector.get(RouterLink).urlTree?.toString()).toBe('/activities/next-activity');
    expect(link?.query(By.css('button')).nativeElement.getAttribute('aria-label')).toBe(
      'Ver etapas de Consulta médica',
    );
  });

  it('renders a welcoming empty state when there is no next activity', () => {
    activityService.getHomeOverview.mockReturnValue(of(makeOverview({ nextActivity: null })));

    createComponent();

    expect(getText()).toContain('Você não possui atividades pendentes.');
    expect(getText()).not.toContain('Ver etapas');
  });

  it('renders the recent completed activities as a semantic list', () => {
    createComponent();

    const historyItems = fixture.nativeElement.querySelectorAll('.recent-history__list li');

    expect(historyItems).toHaveLength(2);
    expect(historyItems[0].textContent).toContain('Caminhada matinal');
    expect(historyItems[1].textContent).toContain('Tomar vitamina');
  });

  it('renders the recent history empty state', () => {
    activityService.getHomeOverview.mockReturnValue(
      of(makeOverview({ recentCompletedActivities: [] })),
    );

    createComponent();

    expect(getText()).toContain('Você ainda não concluiu nenhuma atividade.');
  });

  it('renders all summary values with plural labels', () => {
    createComponent();

    expect(getText()).toContain('2 pendentes');
    expect(getText()).toContain('3 em andamento');
    expect(getText()).toContain('4 concluídas');
  });

  it('renders singular summary labels', () => {
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          todaySummary: { pending: 1, inProgress: 1, completed: 1 },
        }),
      ),
    );

    createComponent();

    expect(getText()).toContain('1 pendente');
    expect(getText()).toContain('1 em andamento');
    expect(getText()).toContain('1 concluída');
  });

  it('ends loading, shows one general error and preserves the home structure on failure', () => {
    activityService.getHomeOverview.mockReturnValue(throwError(() => new Error('Load failed')));

    createComponent();

    expect(getContentRegion().getAttribute('aria-busy')).toBe('false');
    expect(getText()).toContain('Não foi possível carregar os dados da página inicial.');
    expect(getText()).toContain('Próxima atividade');
    expect(getText()).toContain('Resumo do dia');
    expect(getText()).toContain('Histórico recente');
    expect(getAlertAction()?.textContent).toContain('Tentar novamente');
  });

  it('retries the overview after an error', () => {
    activityService.getHomeOverview
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(of(makeOverview()));
    createComponent();

    getAlertAction()?.click();
    fixture.detectChanges();

    expect(activityService.getHomeOverview).toHaveBeenCalledTimes(2);
    expect(getText()).not.toContain('Não foi possível carregar os dados da página inicial.');
    expect(getText()).toContain('Consulta médica');
  });

  it('does not start a concurrent retry while an overview request is loading', () => {
    const retrySubject = new Subject<HomeActivityOverview>();
    activityService.getHomeOverview
      .mockReturnValueOnce(throwError(() => new Error('Load failed')))
      .mockReturnValueOnce(retrySubject.asObservable());
    createComponent();
    const retryButton = getAlertAction();

    retryButton?.click();
    retryButton?.click();

    expect(activityService.getHomeOverview).toHaveBeenCalledTimes(2);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }

  function getContentRegion(): HTMLElement {
    return fixture.nativeElement.querySelector('.home__content')!;
  }

  function getAlertAction(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.inline-alert__action-message');
  }
});

function makeOverview(overrides: Partial<HomeActivityOverview> = {}): HomeActivityOverview {
  return {
    nextActivity: makeActivity({
      id: 'next-activity',
      title: 'Consulta médica',
      date: '2026-07-20',
      time: '14:00',
    }),
    recentCompletedActivities: [
      makeCompletedActivity('completed-1', 'Caminhada matinal', '2026-07-19T15:00:00.000Z'),
      makeCompletedActivity('completed-2', 'Tomar vitamina', '2026-07-18T12:00:00.000Z'),
    ],
    reminders: [],
    todaySummary: {
      pending: 2,
      inProgress: 3,
      completed: 4,
    },
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Atividade',
    date: '2026-07-19',
    steps: [{ id: 'step-1', description: 'Realizar atividade', order: 1 }],
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    ...overrides,
  };
}

function makeCompletedActivity(id: string, title: string, updatedAt: string): Activity {
  return makeActivity({
    id,
    title,
    updatedAt,
    steps: [
      {
        id: `${id}-step`,
        description: 'Realizar atividade',
        order: 1,
        completedAt: updatedAt,
      },
    ],
  });
}

type ActivityServiceMock = {
  getHomeOverview: Mock<() => Observable<HomeActivityOverview>>;
};
