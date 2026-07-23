import {
  createActivity,
  type Activity,
  type EntityId,
  type DateOnlyString,
  type TimeString,
} from "../../domain/index.js";
import type { ActivityRepository } from "../repositories/index.js";
import type { Clock, IdGenerator } from "../services/index.js";

export type CreateActivityUseCaseInput = {
  userId: EntityId;
  title: string;
  description?: string;
  date: DateOnlyString;
  time?: TimeString;
  steps: string[];
};

export class CreateActivityUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateActivityUseCaseInput): Promise<Activity> {
    const now = this.clock.now();

    const activity = createActivity({
      id: this.idGenerator.generate(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      date: input.date,
      time: input.time,
      steps: input.steps.map((description, index) => ({
        id: this.idGenerator.generate(),
        description,
        order: index + 1,
      })),
      createdAt: now,
      updatedAt: now,
    });

    return this.activityRepository.create(activity);
  }
}
