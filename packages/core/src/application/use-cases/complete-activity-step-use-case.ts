import {
  completeActivityStep,
  type Activity,
  type EntityId,
} from "../../domain";
import { ApplicationError } from "../errors";
import type { ActivityRepository } from "../repositories";
import type { Clock } from "../services";

export type CompleteActivityStepUseCaseInput = {
  activityId: EntityId;
  stepId: EntityId;
};

export class CompleteActivityStepUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CompleteActivityStepUseCaseInput): Promise<Activity> {
    const activity = await this.activityRepository.findById(input.activityId);

    if (!activity) {
      throw new ApplicationError("ACTIVITY_NOT_FOUND");
    }

    const completedAt = this.clock.now();

    const updatedActivity = completeActivityStep(
      activity,
      input.stepId,
      completedAt,
    );

    return this.activityRepository.update(updatedActivity);
  }
}
