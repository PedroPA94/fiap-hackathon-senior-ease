import { describe, expect, it } from "vitest";

import { ResetAccessibilityPreferencesUseCase } from "../../../src/application";
import {
  defaultAccessibilityPreferences,
  DomainError,
  type AccessibilityPreferences,
} from "../../../src/domain";
import { InMemoryAccessibilityPreferencesRepository } from "../../helpers/in-memory-accessibility-preferences-repository";

function makeUseCase() {
  const repository = new InMemoryAccessibilityPreferencesRepository();
  const useCase = new ResetAccessibilityPreferencesUseCase(repository);

  return { repository, useCase };
}

describe("ResetAccessibilityPreferencesUseCase", () => {
  it("saves defaultAccessibilityPreferences for the userId", async () => {
    const { repository, useCase } = makeUseCase();

    await useCase.execute({ userId: "user-1" });

    await expect(repository.findByUserId("user-1")).resolves.toBe(
      defaultAccessibilityPreferences,
    );
  });

  it("returns defaultAccessibilityPreferences", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ userId: "user-1" })).resolves.toBe(
      defaultAccessibilityPreferences,
    );
  });

  it("overwrites previously saved preferences", async () => {
    const { repository, useCase } = makeUseCase();
    const previousPreferences: AccessibilityPreferences = {
      fontSize: "extra",
      contrast: "high",
      spacing: "extraWide",
      interfaceMode: "advanced",
      enhancedFeedback: false,
      confirmCriticalActions: false,
      remindersEnabled: true,
      reminderAdvance: "oneHour",
    };
    await repository.save("user-1", previousPreferences);

    await useCase.execute({ userId: "user-1" });

    await expect(repository.findByUserId("user-1")).resolves.toBe(
      defaultAccessibilityPreferences,
    );
  });

  it("throws DomainError when userId is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ userId: "" })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ userId: "" })).rejects.toThrow(
      expect.objectContaining({ code: "ACCESSIBILITY_USER_ID_REQUIRED" }),
    );
  });
});
