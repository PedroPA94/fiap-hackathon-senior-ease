export type FontSizePreference = "normal" | "large" | "extra";

export type ContrastPreference = "default" | "high";

export type SpacingPreference = "comfortable" | "wide" | "extraWide";

export type InterfaceMode = "basic" | "advanced";

export type AccessibilityPreferences = {
  fontSize: FontSizePreference;
  contrast: ContrastPreference;
  spacing: SpacingPreference;
  interfaceMode: InterfaceMode;
  enhancedFeedback: boolean;
  confirmCriticalActions: boolean;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  fontSize: "normal",
  contrast: "default",
  spacing: "comfortable",
  interfaceMode: "basic",
  enhancedFeedback: false,
  confirmCriticalActions: true,
};
