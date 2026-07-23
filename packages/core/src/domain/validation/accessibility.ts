import { DomainError } from "../errors/index.js";
import {
  type AccessibilityPreferences,
  type ContrastPreference,
  type FontSizePreference,
  type InterfaceMode,
  type ReminderAdvance,
  type SpacingPreference,
} from "../types/index.js";

const fontSizePreferences: readonly FontSizePreference[] = ["normal", "large", "extra"];

const contrastPreferences: readonly ContrastPreference[] = ["default", "high"];

const spacingPreferences: readonly SpacingPreference[] = [
  "comfortable",
  "wide",
  "extraWide",
];

const interfaceModes: readonly InterfaceMode[] = ["basic", "advanced"];

const reminderAdvances: readonly ReminderAdvance[] = [
  "atTime",
  "thirtyMinutes",
  "oneHour",
  "oneDay",
];

export function validateAccessibilityPreferences(
  input: unknown,
): AccessibilityPreferences {
  if (!isRecord(input)) {
    throw new DomainError("ACCESSIBILITY_PREFERENCES_INVALID");
  }

  const fontSize = input["fontSize"];
  if (!isIncluded(fontSizePreferences, fontSize)) {
    throw new DomainError("ACCESSIBILITY_FONT_SIZE_INVALID");
  }

  const contrast = input["contrast"];
  if (!isIncluded(contrastPreferences, contrast)) {
    throw new DomainError("ACCESSIBILITY_CONTRAST_INVALID");
  }

  const spacing = input["spacing"];
  if (!isIncluded(spacingPreferences, spacing)) {
    throw new DomainError("ACCESSIBILITY_SPACING_INVALID");
  }

  const interfaceMode = input["interfaceMode"];
  if (!isIncluded(interfaceModes, interfaceMode)) {
    throw new DomainError("ACCESSIBILITY_INTERFACE_MODE_INVALID");
  }

  const enhancedFeedback = input["enhancedFeedback"];
  if (typeof enhancedFeedback !== "boolean") {
    throw new DomainError("ACCESSIBILITY_ENHANCED_FEEDBACK_INVALID");
  }

  const confirmCriticalActions = input["confirmCriticalActions"];
  if (typeof confirmCriticalActions !== "boolean") {
    throw new DomainError("ACCESSIBILITY_CONFIRM_CRITICAL_ACTIONS_INVALID");
  }

  const remindersEnabled = input["remindersEnabled"];
  if (typeof remindersEnabled !== "boolean") {
    throw new DomainError("ACCESSIBILITY_REMINDERS_ENABLED_INVALID");
  }

  const reminderAdvance = input["reminderAdvance"];
  if (!isIncluded(reminderAdvances, reminderAdvance)) {
    throw new DomainError("ACCESSIBILITY_REMINDER_ADVANCE_INVALID");
  }

  return {
    fontSize,
    contrast,
    spacing,
    interfaceMode,
    enhancedFeedback,
    confirmCriticalActions,
    remindersEnabled,
    reminderAdvance,
  };
}

function isIncluded<T>(options: readonly T[], value: unknown): value is T {
  return options.some((option) => option === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
