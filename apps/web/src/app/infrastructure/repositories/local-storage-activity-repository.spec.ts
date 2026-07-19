import { TestBed } from '@angular/core/testing';

import type { Activity } from '@senior-ease/core';

import { storageKeys } from '../../core/constants/storage-keys';
import { LocalStorageActivityRepository } from './local-storage-activity-repository';

describe('LocalStorageActivityRepository', () => {
  const userId = 'user-1';
  const storageKey = storageKeys.activities(userId);

  let repository: LocalStorageActivityRepository;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [LocalStorageActivityRepository],
    });

    repository = TestBed.inject(LocalStorageActivityRepository);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return an empty list when the user has no stored activities', async () => {
    await expect(repository.list({ userId })).resolves.toEqual([]);
  });

  it('should list only activities from the informed user', async () => {
    await repository.create(makeActivity({ id: 'activity-1' }));
    await repository.create(makeActivity({ id: 'activity-2', userId: 'user-2' }));

    await expect(repository.list({ userId })).resolves.toEqual([
      expect.objectContaining({ id: 'activity-1', userId }),
    ]);
    await expect(repository.list({ userId: 'user-2' })).resolves.toEqual([
      expect.objectContaining({ id: 'activity-2', userId: 'user-2' }),
    ]);
  });

  it('should filter listed activities by date', async () => {
    await repository.create(makeActivity({ id: 'activity-1', date: '2026-07-09' }));
    await repository.create(makeActivity({ id: 'activity-2', date: '2026-07-10' }));

    const activities = await repository.list({
      userId,
      date: '2026-07-10',
    });

    expect(activities.map((activity) => activity.id)).toEqual(['activity-2']);
  });

  it('should find an activity using its complete identity', async () => {
    await repository.create(makeActivity());

    await expect(repository.findById({ userId, activityId: 'activity-1' })).resolves.toEqual(
      expect.objectContaining({ id: 'activity-1', userId }),
    );
  });

  it('should return null when an activity is missing or belongs to another user', async () => {
    await repository.create(makeActivity());

    await expect(
      repository.findById({ userId, activityId: 'missing-activity' }),
    ).resolves.toBeNull();
    await expect(
      repository.findById({ userId: 'user-2', activityId: 'activity-1' }),
    ).resolves.toBeNull();
  });

  it('should create, normalize and persist an activity', async () => {
    const activity = makeActivity({
      title: '  Tomar remédio  ',
      description: '  Após o almoço  ',
      steps: [
        { id: 'step-2', description: '  Beber água  ', order: 2 },
        { id: 'step-1', description: '  Pegar o remédio  ', order: 1 },
      ],
    });

    const createdActivity = await repository.create(activity);

    expect(createdActivity.title).toBe('Tomar remédio');
    expect(createdActivity.description).toBe('Após o almoço');
    expect(createdActivity.steps.map((step) => step.id)).toEqual(['step-1', 'step-2']);
    expect(createdActivity.steps.map((step) => step.description)).toEqual([
      'Pegar o remédio',
      'Beber água',
    ]);
    expect(readStoredActivities()).toEqual([createdActivity]);
  });

  it('should reject an invalid activity without storing it', async () => {
    const invalidActivity = makeActivity({ title: ' ' });

    await expect(repository.create(invalidActivity)).rejects.toThrow();

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should reject a duplicated activity', async () => {
    await repository.create(makeActivity());

    await expect(repository.create(makeActivity())).rejects.toMatchObject({
      code: 'ACTIVITY_ALREADY_EXISTS',
    });
    expect(readStoredActivities()).toHaveLength(1);
  });

  it('should update and persist an existing activity', async () => {
    await repository.create(makeActivity());

    const updatedActivity = await repository.update(
      makeActivity({
        title: 'Atividade atualizada',
        updatedAt: '2026-07-09T13:00:00.000Z',
      }),
    );

    expect(updatedActivity.title).toBe('Atividade atualizada');
    expect(readStoredActivities()).toEqual([updatedActivity]);
  });

  it('should reject an update when the activity does not exist', async () => {
    await expect(repository.update(makeActivity())).rejects.toMatchObject({
      code: 'ACTIVITY_NOT_FOUND',
    });
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should delete an existing activity without affecting the others', async () => {
    await repository.create(makeActivity({ id: 'activity-1' }));
    await repository.create(
      makeActivity({
        id: 'activity-2',
        steps: [{ id: 'activity-2-step', description: 'Caminhar', order: 1 }],
      }),
    );

    await repository.delete({ userId, activityId: 'activity-1' });

    expect(readStoredActivities().map((activity) => activity.id)).toEqual(['activity-2']);
  });

  it('should treat deletion of a missing activity as an idempotent operation', async () => {
    await repository.create(makeActivity());
    const storedValue = localStorage.getItem(storageKey);

    await expect(
      repository.delete({ userId, activityId: 'missing-activity' }),
    ).resolves.toBeUndefined();

    expect(localStorage.getItem(storageKey)).toBe(storedValue);
  });

  it('should not delete an activity through another user identity', async () => {
    await repository.create(makeActivity());

    await repository.delete({ userId: 'user-2', activityId: 'activity-1' });

    await expect(repository.findById({ userId, activityId: 'activity-1' })).resolves.toEqual(
      expect.objectContaining({ id: 'activity-1' }),
    );
  });

  it('should remove malformed JSON from storage', async () => {
    localStorage.setItem(storageKey, '{invalid-json');

    await expect(repository.list({ userId })).resolves.toEqual([]);

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should remove a stored value that is not an array', async () => {
    localStorage.setItem(storageKey, JSON.stringify(makeActivity()));

    await expect(repository.list({ userId })).resolves.toEqual([]);

    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should discard invalid and foreign records while preserving valid activities', async () => {
    const validActivity = makeActivity();
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        validActivity,
        { ...validActivity, id: 'invalid-activity', steps: 'invalid' },
        { ...validActivity, id: 'foreign-activity', userId: 'user-2' },
      ]),
    );

    const activities = await repository.list({ userId });

    expect(activities).toEqual([validActivity]);
    expect(readStoredActivities()).toEqual([validActivity]);
  });

  it('should return normalized activities read from storage', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        makeActivity({
          title: '  Tomar remédio  ',
          steps: [
            { id: 'step-2', description: 'Beber água', order: 2 },
            { id: 'step-1', description: 'Pegar o remédio', order: 1 },
          ],
        }),
      ]),
    );

    const [activity] = await repository.list({ userId });

    expect(activity?.title).toBe('Tomar remédio');
    expect(activity?.steps.map((step) => step.id)).toEqual(['step-1', 'step-2']);
  });

  it('should protect persisted data with defensive copies', async () => {
    const input = makeActivity();
    const createdActivity = await repository.create(input);

    input.title = 'Entrada alterada';
    input.steps[0]!.description = 'Passo alterado na entrada';
    createdActivity.title = 'Retorno alterado';
    createdActivity.steps[0]!.description = 'Passo alterado no retorno';

    const storedActivity = await repository.findById({
      userId,
      activityId: 'activity-1',
    });

    expect(storedActivity?.title).toBe('Tomar remédio');
    expect(storedActivity?.steps[0]?.description).toBe('Pegar o remédio');
  });

  it('should return new defensive copies on each read', async () => {
    await repository.create(makeActivity());
    const [firstRead] = await repository.list({ userId });

    firstRead!.title = 'Leitura alterada';
    firstRead!.steps[0]!.description = 'Passo alterado';

    const [secondRead] = await repository.list({ userId });

    expect(secondRead?.title).toBe('Tomar remédio');
    expect(secondRead?.steps[0]?.description).toBe('Pegar o remédio');
  });

  function makeActivity(overrides: Partial<Activity> = {}): Activity {
    return {
      id: 'activity-1',
      userId,
      title: 'Tomar remédio',
      description: 'Após o almoço',
      date: '2026-07-09',
      time: '12:30',
      steps: [
        { id: 'step-1', description: 'Pegar o remédio', order: 1 },
        { id: 'step-2', description: 'Beber água', order: 2 },
      ],
      createdAt: '2026-07-09T11:00:00.000Z',
      updatedAt: '2026-07-09T11:00:00.000Z',
      ...overrides,
    };
  }

  function readStoredActivities(targetUserId = userId): Activity[] {
    const rawValue = localStorage.getItem(storageKeys.activities(targetUserId));

    return rawValue ? (JSON.parse(rawValue) as Activity[]) : [];
  }
});
