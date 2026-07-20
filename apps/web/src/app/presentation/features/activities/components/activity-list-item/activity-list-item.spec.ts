import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import type { Activity } from '@senior-ease/core';

import { ActivityListItem } from './activity-list-item';

describe('ActivityListItem', () => {
  let fixture: ComponentFixture<ActivityListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityListItem],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders title, optional description, local date, time and details link', () => {
    createComponent(
      makeActivity({
        id: 'medicine',
        title: 'Tomar remédio',
        description: 'Após o almoço',
        date: '2026-07-20',
        time: '14:30',
      }),
    );

    expect(getText()).toContain('Tomar remédio');
    expect(getText()).toContain('Após o almoço');
    expect(getText()).toContain('20 de julho de 2026');
    expect(getText()).toContain('14:30');
    expect(getDetailsRouterLink().urlTree!.toString()).toBe('/activities/medicine');
  });

  it('omits the description when it is absent', () => {
    createComponent(makeActivity());

    expect(fixture.nativeElement.querySelector('.activity-item__description')).toBeNull();
  });

  it.each([
    {
      name: 'pending',
      steps: [makeStep('step-1')],
      status: 'Não iniciada',
      progress: '0 de 1 etapas',
    },
    {
      name: 'in progress',
      steps: [makeStep('step-1', true), makeStep('step-2')],
      status: 'Em andamento',
      progress: '1 de 2 etapas',
    },
    {
      name: 'completed',
      steps: [makeStep('step-1', true)],
      status: 'Concluída',
      progress: '1 de 1 etapas',
    },
  ])(
    'uses core-derived status and progress for an $name activity',
    ({ steps, status, progress }) => {
      createComponent(makeActivity({ steps }));

      expect(getText()).toContain(status);
      expect(getText()).toContain(progress);
    },
  );

  function createComponent(activity: Activity): void {
    fixture = TestBed.createComponent(ActivityListItem);
    fixture.componentRef.setInput('activity', activity);
    fixture.detectChanges();
  }

  function getText(): string {
    return fixture.nativeElement.textContent;
  }

  function getDetailsRouterLink(): RouterLink {
    return fixture.debugElement.query(By.css('.activity-item__action')).injector.get(RouterLink);
  }
});

function makeStep(id: string, completed = false): Activity['steps'][number] {
  return {
    id,
    description: `Etapa ${id}`,
    order: Number(id.split('-')[1]),
    completedAt: completed ? '2026-07-20T12:00:00.000Z' : undefined,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Atividade',
    date: '2026-07-20',
    steps: [makeStep('step-1')],
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  };
}
