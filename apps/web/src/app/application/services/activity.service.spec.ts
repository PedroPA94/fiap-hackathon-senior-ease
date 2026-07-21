import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable } from 'rxjs';

import {
  defaultAccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type Activity,
  type ActivityRepository,
  type Clock,
  type IdGenerator,
} from '@senior-ease/core';

import {
  ACCESSIBILITY_PREFERENCES_REPOSITORY,
  ACTIVITY_REPOSITORY,
} from '../../core/tokens/repository.tokens';
import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import { UserSessionError } from '../errors/user-session.error';
import { ActivityService } from './activity.service';
import { UserSessionService } from './user-session.service';

describe('ActivityService', () => {
  const userId = 'user-1';
  const now = '2026-07-09T12:00:00.000Z';
  const today = '2026-07-09';

  let activityRepository: ActivityRepositoryMock;
  let accessibilityPreferencesRepository: AccessibilityPreferencesRepositoryMock;
  let clock: ClockMock;
  let idGenerator: IdGeneratorMock;
  let service: ActivityService;
  let userSessionService: UserSessionServiceMock;

  beforeEach(() => {
    activityRepository = createActivityRepositoryMock();
    accessibilityPreferencesRepository = createAccessibilityPreferencesRepositoryMock();
    clock = createClockMock();
    idGenerator = createIdGeneratorMock();
    userSessionService = createUserSessionServiceMock();

    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        { provide: ACTIVITY_REPOSITORY, useValue: activityRepository },
        {
          provide: ACCESSIBILITY_PREFERENCES_REPOSITORY,
          useValue: accessibilityPreferencesRepository,
        },
        { provide: CLOCK, useValue: clock },
        { provide: ID_GENERATOR, useValue: idGenerator },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    });

    service = TestBed.inject(ActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should defer session and repository access until subscription', async () => {
    const activities$ = service.listActivities();

    expect(userSessionService.getCurrentUserId).not.toHaveBeenCalled();
    expect(activityRepository.list).not.toHaveBeenCalled();

    await firstValueFrom(activities$);

    expect(userSessionService.getCurrentUserId).toHaveBeenCalledOnce();
    expect(activityRepository.list).toHaveBeenCalledOnce();
  });

  it('should list all current user activities by default and sort their steps', async () => {
    activityRepository.list.mockResolvedValue([
      makeActivity({
        steps: [
          { id: 'step-2', description: 'Beber água', order: 2 },
          { id: 'step-1', description: 'Pegar o remédio', order: 1 },
        ],
      }),
    ]);

    const activities = await firstValueFrom(service.listActivities());

    expect(activityRepository.list).toHaveBeenCalledWith({
      userId,
      date: undefined,
    });
    expect(activities[0]?.steps.map((step) => step.id)).toEqual(['step-1', 'step-2']);
  });

  it('should use the clock date when listing today activities', async () => {
    await firstValueFrom(service.listActivities('today'));

    expect(clock.today).toHaveBeenCalledOnce();
    expect(activityRepository.list).toHaveBeenCalledWith({
      userId,
      date: today,
    });
  });

  it('should filter listed activities by derived status', async () => {
    activityRepository.list.mockResolvedValue([
      makeActivity({ id: 'pending-activity' }),
      makeActivity({
        id: 'completed-activity',
        steps: [
          {
            id: 'completed-step',
            description: 'Pegar o remédio',
            order: 1,
            completedAt: now,
          },
        ],
      }),
    ]);

    const activities = await firstValueFrom(service.listActivities('completed'));

    expect(activities.map((activity) => activity.id)).toEqual(['completed-activity']);
  });

  it('should return the home overview with the default recent activity limit', async () => {
    activityRepository.list.mockResolvedValue([
      makeCompletedActivity('oldest-activity', '2026-07-09T11:00:00.000Z'),
      makeCompletedActivity('newest-activity', '2026-07-09T14:00:00.000Z'),
      makeCompletedActivity('middle-activity', '2026-07-09T13:00:00.000Z'),
    ]);

    const overview = await firstValueFrom(service.getHomeOverview());

    expect(activityRepository.list).toHaveBeenCalledWith({ userId });
    expect(overview.recentCompletedActivities.map((activity) => activity.id)).toEqual([
      'newest-activity',
      'middle-activity',
    ]);
    expect(overview.todaySummary.completed).toBe(3);
    expect(overview.reminders).toEqual([]);
  });

  it('should include available reminders in the home overview', async () => {
    clock.now.mockReturnValue(new Date(2026, 6, 9, 12).toISOString());
    accessibilityPreferencesRepository.findByUserId.mockResolvedValue({
      ...defaultAccessibilityPreferences,
      remindersEnabled: true,
      reminderAdvance: 'oneHour',
    });
    activityRepository.list.mockResolvedValue([
      makeActivity({ id: 'reminder-activity', date: today, time: '12:30' }),
    ]);

    const overview = await firstValueFrom(service.getHomeOverview());

    expect(accessibilityPreferencesRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(overview.reminders.map(({ activityId }) => activityId)).toEqual(['reminder-activity']);
  });

  it('should forward a custom recent activity limit to the home overview', async () => {
    activityRepository.list.mockResolvedValue([
      makeCompletedActivity('activity-1', '2026-07-09T11:00:00.000Z'),
      makeCompletedActivity('activity-2', '2026-07-09T12:00:00.000Z'),
    ]);

    const overview = await firstValueFrom(service.getHomeOverview(1));

    expect(overview.recentCompletedActivities.map((activity) => activity.id)).toEqual([
      'activity-2',
    ]);
  });

  it('should keep the home overview observable cold and execute once per subscription', async () => {
    const overview$ = service.getHomeOverview();

    expect(userSessionService.getCurrentUserId).not.toHaveBeenCalled();
    expect(activityRepository.list).not.toHaveBeenCalled();

    await firstValueFrom(overview$);
    await firstValueFrom(overview$);

    expect(userSessionService.getCurrentUserId).toHaveBeenCalledTimes(2);
    expect(activityRepository.list).toHaveBeenCalledTimes(2);
    expect(clock.today).toHaveBeenCalledTimes(2);
  });

  it('should propagate home overview repository errors without changing them', async () => {
    const repositoryError = new Error('Overview unavailable');
    activityRepository.list.mockRejectedValue(repositoryError);

    await expect(firstValueFrom(service.getHomeOverview())).rejects.toBe(repositoryError);
  });

  it('should create an activity for the current user using generated ids and clock', async () => {
    idGenerator.generate
      .mockReturnValueOnce('activity-generated')
      .mockReturnValueOnce('step-generated-1')
      .mockReturnValueOnce('step-generated-2');
    const input = {
      title: 'Tomar remédio',
      description: 'Após o almoço',
      date: today,
      time: '12:30',
      steps: ['Pegar o remédio', 'Beber água'],
    };

    const activity = await firstValueFrom(service.createActivity(input));

    expect(clock.now).toHaveBeenCalledOnce();
    expect(activityRepository.create).toHaveBeenCalledWith({
      id: 'activity-generated',
      userId,
      title: input.title,
      description: input.description,
      date: input.date,
      time: input.time,
      steps: [
        { id: 'step-generated-1', description: 'Pegar o remédio', order: 1 },
        { id: 'step-generated-2', description: 'Beber água', order: 2 },
      ],
      createdAt: now,
      updatedAt: now,
    });
    expect(activity.id).toBe('activity-generated');
  });

  it('should get an activity using the current user identity', async () => {
    const expectedActivity = makeActivity();
    activityRepository.findById.mockResolvedValue(expectedActivity);

    await expect(firstValueFrom(service.getActivityById('activity-1'))).resolves.toBe(
      expectedActivity,
    );
    expect(activityRepository.findById).toHaveBeenCalledWith({
      userId,
      activityId: 'activity-1',
    });
  });

  it('should keep activity lookup cold and execute it once per subscription', async () => {
    activityRepository.findById.mockResolvedValue(makeActivity());
    const activity$ = service.getActivityById('activity-1');

    expect(userSessionService.getCurrentUserId).not.toHaveBeenCalled();
    expect(activityRepository.findById).not.toHaveBeenCalled();

    await firstValueFrom(activity$);
    await firstValueFrom(activity$);

    expect(userSessionService.getCurrentUserId).toHaveBeenCalledTimes(2);
    expect(activityRepository.findById).toHaveBeenCalledTimes(2);
  });

  it('should propagate activity lookup errors without changing them', async () => {
    const repositoryError = new Error('Lookup unavailable');
    activityRepository.findById.mockRejectedValue(repositoryError);

    await expect(firstValueFrom(service.getActivityById('activity-1'))).rejects.toBe(
      repositoryError,
    );
  });

  it('should complete a current user activity and persist the update', async () => {
    activityRepository.findById.mockResolvedValue(makeActivity());

    const activity = await firstValueFrom(service.completeActivity('activity-1'));

    expect(activityRepository.findById).toHaveBeenCalledWith({
      userId,
      activityId: 'activity-1',
    });
    expect(activity.steps.every((step) => step.completedAt === now)).toBe(true);
    expect(activity.updatedAt).toBe(now);
    expect(activityRepository.update).toHaveBeenCalledWith(activity);
  });

  it('should complete only the informed step and persist the update', async () => {
    activityRepository.findById.mockResolvedValue(makeActivity());

    const activity = await firstValueFrom(service.completeActivityStep('activity-1', 'step-1'));

    expect(activityRepository.findById).toHaveBeenCalledWith({
      userId,
      activityId: 'activity-1',
    });
    expect(activity.steps.find((step) => step.id === 'step-1')?.completedAt).toBe(now);
    expect(activity.steps.find((step) => step.id === 'step-2')?.completedAt).toBeUndefined();
    expect(activityRepository.update).toHaveBeenCalledWith(activity);
  });

  it('should delete an activity using the current user identity', async () => {
    await expect(firstValueFrom(service.deleteActivity('activity-1'))).resolves.toBeUndefined();

    expect(activityRepository.delete).toHaveBeenCalledOnce();
    expect(activityRepository.delete).toHaveBeenCalledWith({
      userId,
      activityId: 'activity-1',
    });
    expect(activityRepository.findById).not.toHaveBeenCalled();
  });

  it('should keep deletion cold and delegate once per subscription', async () => {
    const deletion$ = service.deleteActivity('activity-1');

    expect(userSessionService.getCurrentUserId).not.toHaveBeenCalled();
    expect(activityRepository.delete).not.toHaveBeenCalled();

    await firstValueFrom(deletion$);
    await firstValueFrom(deletion$);

    expect(userSessionService.getCurrentUserId).toHaveBeenCalledTimes(2);
    expect(activityRepository.delete).toHaveBeenCalledTimes(2);
  });

  it('should propagate deletion errors without changing them', async () => {
    const repositoryError = new Error('Deletion unavailable');
    activityRepository.delete.mockRejectedValue(repositoryError);

    await expect(firstValueFrom(service.deleteActivity('activity-1'))).rejects.toBe(
      repositoryError,
    );
  });

  const operationsRequiringCurrentUser: ReadonlyArray<
    readonly [string, (target: ActivityService) => Observable<unknown>]
  > = [
    ['listActivities', (target: ActivityService) => target.listActivities()],
    ['getHomeOverview', (target: ActivityService) => target.getHomeOverview()],
    [
      'createActivity',
      (target: ActivityService) =>
        target.createActivity({
          title: 'Tomar remédio',
          date: today,
          steps: ['Pegar o remédio'],
        }),
    ],
    ['completeActivity', (target: ActivityService) => target.completeActivity('activity-1')],
    ['getActivityById', (target: ActivityService) => target.getActivityById('activity-1')],
    [
      'completeActivityStep',
      (target: ActivityService) => target.completeActivityStep('activity-1', 'step-1'),
    ],
    ['deleteActivity', (target: ActivityService) => target.deleteActivity('activity-1')],
  ];

  it.each(operationsRequiringCurrentUser)(
    'should require a current user for %s',
    async (_name, execute) => {
      userSessionService.getCurrentUserId.mockReturnValue(null);

      await expect(firstValueFrom(execute(service))).rejects.toEqual(
        new UserSessionError('CURRENT_USER_REQUIRED'),
      );
      expect(activityRepository.list).not.toHaveBeenCalled();
      expect(activityRepository.findById).not.toHaveBeenCalled();
      expect(activityRepository.create).not.toHaveBeenCalled();
      expect(activityRepository.update).not.toHaveBeenCalled();
      expect(activityRepository.delete).not.toHaveBeenCalled();
    },
  );

  it('should propagate repository errors through the observable', async () => {
    const repositoryError = new Error('Repository unavailable');
    activityRepository.list.mockRejectedValue(repositoryError);

    await expect(firstValueFrom(service.listActivities())).rejects.toBe(repositoryError);
  });

  function makeActivity(overrides: Partial<Activity> = {}): Activity {
    return {
      id: 'activity-1',
      userId,
      title: 'Tomar remédio',
      date: today,
      steps: [
        { id: 'step-1', description: 'Pegar o remédio', order: 1 },
        { id: 'step-2', description: 'Beber água', order: 2 },
      ],
      createdAt: '2026-07-09T11:00:00.000Z',
      updatedAt: '2026-07-09T11:00:00.000Z',
      ...overrides,
    };
  }

  function makeCompletedActivity(id: string, updatedAt: string): Activity {
    return makeActivity({
      id,
      updatedAt,
      steps: [
        {
          id: `${id}-step`,
          description: 'Atividade concluída',
          order: 1,
          completedAt: updatedAt,
        },
      ],
    });
  }

  function createActivityRepositoryMock(): ActivityRepositoryMock {
    return {
      list: vi.fn<ActivityRepository['list']>().mockResolvedValue([]),
      findById: vi.fn<ActivityRepository['findById']>().mockResolvedValue(null),
      create: vi
        .fn<ActivityRepository['create']>()
        .mockImplementation((activity) => Promise.resolve(activity)),
      update: vi
        .fn<ActivityRepository['update']>()
        .mockImplementation((activity) => Promise.resolve(activity)),
      delete: vi.fn<ActivityRepository['delete']>().mockResolvedValue(undefined),
    };
  }

  function createAccessibilityPreferencesRepositoryMock(): AccessibilityPreferencesRepositoryMock {
    return {
      findByUserId: vi
        .fn<AccessibilityPreferencesRepository['findByUserId']>()
        .mockResolvedValue(defaultAccessibilityPreferences),
      save: vi
        .fn<AccessibilityPreferencesRepository['save']>()
        .mockImplementation((_userId, preferences) => Promise.resolve(preferences)),
    };
  }

  function createClockMock(): ClockMock {
    return {
      now: vi.fn<Clock['now']>().mockReturnValue(now),
      today: vi.fn<Clock['today']>().mockReturnValue(today),
    };
  }

  function createIdGeneratorMock(): IdGeneratorMock {
    return {
      generate: vi.fn<IdGenerator['generate']>().mockReturnValue('generated-id'),
    };
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      getCurrentUserId: vi.fn<UserSessionService['getCurrentUserId']>().mockReturnValue(userId),
    };
  }
});

type ActivityRepositoryMock = {
  list: ReturnType<typeof vi.fn<ActivityRepository['list']>>;
  findById: ReturnType<typeof vi.fn<ActivityRepository['findById']>>;
  create: ReturnType<typeof vi.fn<ActivityRepository['create']>>;
  update: ReturnType<typeof vi.fn<ActivityRepository['update']>>;
  delete: ReturnType<typeof vi.fn<ActivityRepository['delete']>>;
};

type AccessibilityPreferencesRepositoryMock = {
  findByUserId: ReturnType<typeof vi.fn<AccessibilityPreferencesRepository['findByUserId']>>;
  save: ReturnType<typeof vi.fn<AccessibilityPreferencesRepository['save']>>;
};

type ClockMock = {
  now: ReturnType<typeof vi.fn<Clock['now']>>;
  today: ReturnType<typeof vi.fn<Clock['today']>>;
};

type IdGeneratorMock = {
  generate: ReturnType<typeof vi.fn<IdGenerator['generate']>>;
};

type UserSessionServiceMock = {
  getCurrentUserId: ReturnType<typeof vi.fn<UserSessionService['getCurrentUserId']>>;
};
