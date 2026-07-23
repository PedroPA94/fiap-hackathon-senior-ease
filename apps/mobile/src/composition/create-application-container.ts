import {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  CreateUserProfileUseCase,
  DeleteActivityUseCase,
  GetAccessibilityPreferencesUseCase,
  GetActivityByIdUseCase,
  GetHomeActivityOverviewUseCase,
  GetUserExperienceProfileUseCase,
  GetUserProfileUseCase,
  ListActivitiesByUserUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
} from "@senior-ease/core";

import { AsyncStorageAccessibilityPreferencesRepository } from "../infrastructure/repositories/accessibility-preferences";
import { AsyncStorageActivityRepository } from "../infrastructure/repositories/activity";
import { AsyncStorageUserProfileRepository } from "../infrastructure/repositories/user-profile";
import { RandomIdGenerator, SystemClock } from "../infrastructure/services";
import { AsyncStorageAdapter } from "../infrastructure/storage";
import type {
  ApplicationContainer,
  ApplicationContainerOverrides,
} from "./application-container";

export function createApplicationContainer(
  overrides: ApplicationContainerOverrides = {},
): ApplicationContainer {
  const storage = overrides.storage ?? new AsyncStorageAdapter();
  const clock = overrides.clock ?? new SystemClock();
  const idGenerator = overrides.idGenerator ?? new RandomIdGenerator();

  const activityRepository = new AsyncStorageActivityRepository(storage);
  const userProfileRepository = new AsyncStorageUserProfileRepository(storage);
  const accessibilityPreferencesRepository =
    new AsyncStorageAccessibilityPreferencesRepository(storage);

  return {
    repositories: {
      activities: activityRepository,
      userProfiles: userProfileRepository,
      accessibilityPreferences: accessibilityPreferencesRepository,
    },
    useCases: {
      activities: {
        create: new CreateActivityUseCase(
          activityRepository,
          idGenerator,
          clock,
        ),
        listByUser: new ListActivitiesByUserUseCase(
          activityRepository,
          clock,
        ),
        getById: new GetActivityByIdUseCase(activityRepository),
        getHomeOverview: new GetHomeActivityOverviewUseCase(
          activityRepository,
          accessibilityPreferencesRepository,
          clock,
        ),
        complete: new CompleteActivityUseCase(activityRepository, clock),
        completeStep: new CompleteActivityStepUseCase(
          activityRepository,
          clock,
        ),
        delete: new DeleteActivityUseCase(activityRepository),
      },
      userProfiles: {
        create: new CreateUserProfileUseCase(userProfileRepository, clock),
        get: new GetUserProfileUseCase(userProfileRepository),
        getExperience: new GetUserExperienceProfileUseCase(
          userProfileRepository,
          accessibilityPreferencesRepository,
        ),
      },
      accessibilityPreferences: {
        get: new GetAccessibilityPreferencesUseCase(
          accessibilityPreferencesRepository,
        ),
        update: new UpdateAccessibilityPreferencesUseCase(
          accessibilityPreferencesRepository,
        ),
        reset: new ResetAccessibilityPreferencesUseCase(
          accessibilityPreferencesRepository,
        ),
      },
    },
  };
}
