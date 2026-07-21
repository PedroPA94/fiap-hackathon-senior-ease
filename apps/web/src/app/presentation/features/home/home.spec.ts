import { signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import type { Activity, ActivityReminder, HomeActivityOverview } from '@senior-ease/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { ActivityService } from '../../../application/services/activity.service';
import { ThemeService } from '../../../application/services/theme.service';
import { Home } from './home';

describe('Home', () => {
  let activityService: ActivityServiceMock;
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let interfaceMode: WritableSignal<'basic' | 'advanced'>;

  beforeEach(async () => {
    interfaceMode = signal('advanced');
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
          useValue: { interfaceMode },
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
    expect(getReminderSection()).toBeNull();
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

  it('does not render the reminders section when the overview has none', () => {
    createComponent();

    expect(getReminderSection()).toBeNull();
    expect(getText()).not.toContain('Lembretes');
  });

  it('renders only the first reminder and the additional count in basic mode', () => {
    interfaceMode.set('basic');
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          reminders: [
            makeTimedReminder('first-reminder', 'Tomar remédio', '14:00'),
            makeUntimedReminder('second-reminder', 'Fazer caminhada'),
            makeUntimedReminder('third-reminder', 'Ligar para família'),
          ],
        }),
      ),
    );

    createComponent();

    expect(getReminderItems()).toHaveLength(1);
    expect(getReminderSection()?.textContent).toContain('Tomar remédio');
    expect(getReminderSection()?.textContent).not.toContain('Fazer caminhada');
    expect(getReminderSection()?.textContent).not.toContain('Ligar para família');
    expect(getReminderSection()?.textContent).toContain('25 de julho de 2026 às 14:00');
    expect(getReminderSection()?.textContent).toContain('Você tem mais 2 lembretes.');
    expect(getReminderRoutes()).toEqual(['/activities/first-reminder']);
  });

  it('does not render an additional count for a single basic reminder', () => {
    interfaceMode.set('basic');
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          reminders: [makeTimedReminder('only-reminder', 'Consulta médica', '14:00')],
        }),
      ),
    );

    createComponent();

    expect(getReminderSection()?.textContent).toContain('Ver etapas');
    expect(fixture.nativeElement.querySelector('.home-reminders__additional-count')).toBeNull();
  });

  it('does not invent a time for an untimed basic reminder', () => {
    interfaceMode.set('basic');
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          reminders: [makeUntimedReminder('untimed-reminder', 'Fazer caminhada')],
        }),
      ),
    );

    createComponent();

    const schedule = fixture.nativeElement.querySelector('.home-reminders__schedule');
    expect(schedule.textContent.trim()).toBe('25 de julho de 2026');
    expect(schedule.textContent).not.toContain('00:00');
  });

  it('renders every reminder in received order with its route in advanced mode', () => {
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          reminders: [
            makeTimedReminder('timed-reminder', 'Tomar remédio', '14:00'),
            makeUntimedReminder('untimed-reminder', 'Fazer caminhada'),
          ],
        }),
      ),
    );

    createComponent();

    const items = getReminderItems();
    expect(fixture.nativeElement.querySelector('.home-reminders__list')).toBeTruthy();
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain('Tomar remédio');
    expect(items[0]?.textContent).toContain('25 de julho de 2026 às 14:00');
    expect(items[1]?.textContent).toContain('Fazer caminhada');
    expect(items[1]?.textContent).toContain('25 de julho de 2026');
    expect(items[1]?.textContent).not.toContain('00:00');
    expect(getReminderRoutes()).toEqual([
      '/activities/timed-reminder',
      '/activities/untimed-reminder',
    ]);
  });

  it('reacts to interface mode changes without loading the overview again', () => {
    interfaceMode.set('basic');
    activityService.getHomeOverview.mockReturnValue(
      of(
        makeOverview({
          reminders: [
            makeTimedReminder('first-reminder', 'Tomar remédio', '14:00'),
            makeUntimedReminder('second-reminder', 'Fazer caminhada'),
          ],
        }),
      ),
    );
    createComponent();

    expect(getReminderItems()).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.recent-history')).toBeNull();

    interfaceMode.set('advanced');
    fixture.detectChanges();
    expect(getReminderItems()).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.recent-history')).toBeTruthy();

    interfaceMode.set('basic');
    fixture.detectChanges();
    expect(getReminderItems()).toHaveLength(1);
    expect(activityService.getHomeOverview).toHaveBeenCalledOnce();
  });

  it('updates the reminders when a new overview is received', () => {
    const overviewSubject = new Subject<HomeActivityOverview>();
    activityService.getHomeOverview.mockReturnValue(overviewSubject.asObservable());
    createComponent();

    overviewSubject.next(
      makeOverview({ reminders: [makeUntimedReminder('first', 'Primeiro lembrete')] }),
    );
    fixture.detectChanges();
    expect(getReminderSection()?.textContent).toContain('Primeiro lembrete');

    overviewSubject.next(
      makeOverview({ reminders: [makeUntimedReminder('second', 'Novo lembrete')] }),
    );
    fixture.detectChanges();
    expect(getReminderSection()?.textContent).toContain('Novo lembrete');
    expect(getReminderSection()?.textContent).not.toContain('Primeiro lembrete');
  });

  it('keeps the existing quick actions', () => {
    createComponent();

    const quickActionRoutes = fixture.debugElement
      .query(By.css('.home__quick-actions'))
      .queryAll(By.directive(RouterLink))
      .map((element) => element.injector.get(RouterLink).urlTree?.toString());

    expect(quickActionRoutes).toEqual(['/activities/new', '/personalization']);
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
    expect(getReminderSection()).toBeNull();
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

  function getReminderSection(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.home-reminders');
  }

  function getReminderItems(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.home-reminders__item'));
  }

  function getReminderRoutes(): string[] {
    const section = fixture.debugElement.query(By.css('.home-reminders'));

    return section
      .queryAll(By.directive(RouterLink))
      .map((element) => element.injector.get(RouterLink).urlTree?.toString() ?? '');
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

function makeTimedReminder(activityId: string, title: string, time: string): ActivityReminder {
  return {
    activityId,
    title,
    date: '2026-07-25',
    time,
    scheduledAt: new Date(2026, 6, 25, Number(time.slice(0, 2)), Number(time.slice(3))),
    reminderAt: new Date(2026, 6, 25, Number(time.slice(0, 2)), Number(time.slice(3))),
    hasTime: true,
  };
}

function makeUntimedReminder(activityId: string, title: string): ActivityReminder {
  return {
    activityId,
    title,
    date: '2026-07-25',
    time: null,
    scheduledAt: null,
    reminderAt: null,
    hasTime: false,
  };
}

type ActivityServiceMock = {
  getHomeOverview: Mock<() => Observable<HomeActivityOverview>>;
};
