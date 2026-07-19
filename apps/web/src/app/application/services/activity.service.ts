import { Inject, Injectable } from '@angular/core';
import { defer, from, type Observable } from 'rxjs';

import {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  ListActivitiesByUserUseCase,
  ListRecentCompletedActivitiesByUserUseCase,
  type Activity,
  type ActivityListFilter,
  type ActivityRepository,
  type CreateActivityUseCaseInput,
  type EntityId,
  type Clock,
  type IdGenerator,
} from '@senior-ease/core';

import { UserSessionError } from '../errors/user-session.error';
import { UserSessionService } from './user-session.service';
import { ACTIVITY_REPOSITORY } from '../../core/tokens/repository.tokens';
import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';

export type CreateCurrentUserActivityInput = Omit<CreateActivityUseCaseInput, 'userId'>;

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,

    @Inject(CLOCK)
    private readonly clock: Clock,

    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,

    private readonly userSessionService: UserSessionService,
  ) {}

  listActivities(filter: ActivityListFilter = 'all'): Observable<Activity[]> {
    return defer(() => {
      const useCase = new ListActivitiesByUserUseCase(this.activityRepository, this.clock);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          filter,
        }),
      );
    });
  }

  getRecentCompletedActivities(limit = 2): Observable<Activity[]> {
    return defer(() => {
      const useCase = new ListRecentCompletedActivitiesByUserUseCase(this.activityRepository);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          limit,
        }),
      );
    });
  }

  createActivity(input: CreateCurrentUserActivityInput): Observable<Activity> {
    return defer(() => {
      const useCase = new CreateActivityUseCase(
        this.activityRepository,
        this.idGenerator,
        this.clock,
      );

      return from(
        useCase.execute({
          ...input,
          userId: this.getRequiredCurrentUserId(),
        }),
      );
    });
  }

  completeActivity(activityId: EntityId): Observable<Activity> {
    return defer(() => {
      const useCase = new CompleteActivityUseCase(this.activityRepository, this.clock);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          activityId,
        }),
      );
    });
  }

  completeActivityStep(activityId: EntityId, stepId: EntityId): Observable<Activity> {
    return defer(() => {
      const useCase = new CompleteActivityStepUseCase(this.activityRepository, this.clock);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          activityId,
          stepId,
        }),
      );
    });
  }

  private getRequiredCurrentUserId(): EntityId {
    const userId = this.userSessionService.getCurrentUserId();

    if (!userId) {
      throw new UserSessionError('CURRENT_USER_REQUIRED');
    }

    return userId;
  }
}
