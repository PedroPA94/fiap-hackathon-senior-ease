import { Inject, Injectable } from '@angular/core';
import { defer, from, type Observable } from 'rxjs';

import {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  DeleteActivityUseCase,
  GetActivityByIdUseCase,
  GetHomeActivityOverviewUseCase,
  ListActivitiesByUserUseCase,
  type Activity,
  type ActivityListFilter,
  type ActivityRepository,
  type CreateActivityUseCaseInput,
  type EntityId,
  type HomeActivityOverview,
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

  getHomeOverview(recentActivitiesLimit?: number): Observable<HomeActivityOverview> {
    return defer(() => {
      const useCase = new GetHomeActivityOverviewUseCase(this.activityRepository, this.clock);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          recentActivitiesLimit,
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

  getActivityById(activityId: EntityId): Observable<Activity> {
    return defer(() => {
      const useCase = new GetActivityByIdUseCase(this.activityRepository);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          activityId,
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

  deleteActivity(activityId: EntityId): Observable<void> {
    return defer(() => {
      const useCase = new DeleteActivityUseCase(this.activityRepository);

      return from(
        useCase.execute({
          userId: this.getRequiredCurrentUserId(),
          activityId,
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
