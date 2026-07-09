import { DomainError } from "../errors";
import {
  AccessibilityPreferences,
  ContrastPreference,
  FontSizePreference,
  InterfaceMode,
  SpacingPreference,
} from "../types";

const fontSizePreferences: FontSizePreference[] = ["normal", "large", "extra"];

const contrastPreferences: ContrastPreference[] = ["default", "high"];

const spacingPreferences: SpacingPreference[] = [
  "comfortable",
  "wide",
  "extraWide",
];

const interfaceModes: InterfaceMode[] = ["basic", "advanced"];

export function validateAccessibilityPreferences(
  input: AccessibilityPreferences,
): void {
  if (!fontSizePreferences.includes(input.fontSize)) {
    throw new DomainError("ACCESSIBILITY_FONT_SIZE_INVALID");
  }

  if (!contrastPreferences.includes(input.contrast)) {
    throw new DomainError("ACCESSIBILITY_CONTRAST_INVALID");
  }

  if (!spacingPreferences.includes(input.spacing)) {
    throw new DomainError("ACCESSIBILITY_SPACING_INVALID");
  }

  if (!interfaceModes.includes(input.interfaceMode)) {
    throw new DomainError("ACCESSIBILITY_INTERFACE_MODE_INVALID");
  }

  if (typeof input.enhancedFeedback !== "boolean") {
    throw new DomainError("ACCESSIBILITY_ENHANCED_FEEDBACK_INVALID");
  }

  if (typeof input.confirmCriticalActions !== "boolean") {
    throw new DomainError("ACCESSIBILITY_CONFIRM_CRITICAL_ACTIONS_INVALID");
  }
}
