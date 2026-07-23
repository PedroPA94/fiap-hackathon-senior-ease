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

if (typeof CreateActivityUseCase !== "function") {
  throw new TypeError("CreateActivityUseCase is not a public constructor.");
}

if (typeof GetHomeActivityOverviewUseCase !== "function") {
  throw new TypeError(
    "GetHomeActivityOverviewUseCase is not a public constructor.",
  );
}

if (typeof parseActivity !== "function") {
  throw new TypeError("parseActivity is not a public function.");
}

if (!theme || !spacing || !typography) {
  throw new TypeError("Tokens could not create an accessibility theme.");
}

console.log("Public package exports are valid in Node ESM.");
