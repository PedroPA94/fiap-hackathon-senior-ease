import type {
  AccessibilityPreferencesRepository,
  ActivityRepository,
  Clock,
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
  IdGenerator,
  ListActivitiesByUserUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
  UserProfileRepository,
} from "@senior-ease/core";

import type { Storage } from "../infrastructure/storage";

export type ApplicationContainer = {
  repositories: {
    activities: ActivityRepository;
    userProfiles: UserProfileRepository;
    accessibilityPreferences: AccessibilityPreferencesRepository;
  };
  useCases: {
    activities: {
      create: CreateActivityUseCase;
      listByUser: ListActivitiesByUserUseCase;
      getById: GetActivityByIdUseCase;
      getHomeOverview: GetHomeActivityOverviewUseCase;
      complete: CompleteActivityUseCase;
      completeStep: CompleteActivityStepUseCase;
      delete: DeleteActivityUseCase;
    };
    userProfiles: {
      create: CreateUserProfileUseCase;
      get: GetUserProfileUseCase;
      getExperience: GetUserExperienceProfileUseCase;
    };
    accessibilityPreferences: {
      get: GetAccessibilityPreferencesUseCase;
      update: UpdateAccessibilityPreferencesUseCase;
      reset: ResetAccessibilityPreferencesUseCase;
    };
  };
};

export type ApplicationContainerOverrides = {
  storage?: Storage;
  clock?: Clock;
  idGenerator?: IdGenerator;
};
