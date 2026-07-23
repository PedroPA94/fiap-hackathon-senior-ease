import {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  CreateUserProfileUseCase,
  DeleteActivityUseCase,
  GetAccessibilityPreferencesUseCase,
  GetActivityByIdUseCase,
  GetHomeActivityOverviewUseCase,
  GetUserProfileUseCase,
  ListActivitiesByUserUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
  defaultAccessibilityPreferences,
  parseActivity,
  validateAccessibilityPreferences,
  type AccessibilityPreferences,
  type AccessibilityPreferencesRepository,
  type Activity,
  type ActivityRepository,
  type Clock,
  type EntityId,
  type IdGenerator,
  type UserProfileRepository,
} from "@senior-ease/core";

import {
  borderWidth,
  breakpoints,
  colors,
  createAccessibilityTheme,
  radius,
  spacing,
  typography,
} from "@senior-ease/tokens";

export const publicRuntimeSymbols = {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  CreateUserProfileUseCase,
  DeleteActivityUseCase,
  GetAccessibilityPreferencesUseCase,
  GetActivityByIdUseCase,
  GetHomeActivityOverviewUseCase,
  GetUserProfileUseCase,
  ListActivitiesByUserUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
  defaultAccessibilityPreferences,
  parseActivity,
  validateAccessibilityPreferences,
  borderWidth,
  breakpoints,
  colors,
  createAccessibilityTheme,
  radius,
  spacing,
  typography,
};

export type PublicCoreTypes = {
  accessibilityPreferences: AccessibilityPreferences;
  accessibilityPreferencesRepository: AccessibilityPreferencesRepository;
  activity: Activity;
  activityRepository: ActivityRepository;
  clock: Clock;
  entityId: EntityId;
  idGenerator: IdGenerator;
  userProfileRepository: UserProfileRepository;
};
