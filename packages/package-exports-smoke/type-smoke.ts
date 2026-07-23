import {
  CreateActivityUseCase,
  GetHomeActivityOverviewUseCase,
  defaultAccessibilityPreferences,
  parseActivity,
} from "@senior-ease/core";

import {
  createAccessibilityTheme,
  spacing,
  typography,
} from "@senior-ease/tokens";

const theme = createAccessibilityTheme(defaultAccessibilityPreferences);

if (
  typeof CreateActivityUseCase !== "function" ||
  typeof GetHomeActivityOverviewUseCase !== "function" ||
  typeof parseActivity !== "function" ||
  !theme ||
  !spacing ||
  !typography
) {
  throw new Error("Public package type smoke test failed.");
}
