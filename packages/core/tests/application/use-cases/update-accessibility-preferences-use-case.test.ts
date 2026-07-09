import { describe, expect, it } from "vitest";

import { UpdateAccessibilityPreferencesUseCase } from "../../../src/application";
import {
  defaultAccessibilityPreferences,
  DomainError,
  type AccessibilityPreferences,
} from "../../../src/domain";
import { InMemoryAccessibilityPreferencesRepository } from "../../helpers/in-memory-accessibility-preferences-repository";

function makeUseCase() {
  const repository = new InMemoryAccessibilityPreferencesRepository();
  const useCase = new UpdateAccessibilityPreferencesUseCase(repository);

  return { repository, useCase };
}

describe("UpdateAccessibilityPreferencesUseCase", () => {
  it("saves and returns the informed preferences", async () => {
    const { useCase } = makeUseCase();
    const preferences: AccessibilityPreferences = {
      fontSize: "extra",
      contrast: "high",
      spacing: "extraWide",
      interfaceMode: "advanced",
      enhancedFeedback: false,
      confirmCriticalActions: false,
    };

    await expect(
      useCase.execute({ userId: "user-1", preferences }),
    ).resolves.toBe(preferences);
  });

  it("persists preferences in the repository", async () => {
    const { repository, useCase } = makeUseCase();
    const preferences: AccessibilityPreferences = {
      ...defaultAccessibilityPreferences,
      fontSize: "large",
      spacing: "wide",
    };

    await useCase.execute({ userId: "user-1", preferences });

    await expect(repository.findByUserId("user-1")).resolves.toBe(preferences);
  });

  it("throws DomainError when userId is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        userId: "",
        preferences: defaultAccessibilityPreferences,
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({
        userId: "",
        preferences: defaultAccessibilityPreferences,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "ACCESSIBILITY_USER_ID_REQUIRED" }),
    );
  });

  it("validates invalid preferences through the domain validation", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        userId: "user-1",
        preferences: {
          ...defaultAccessibilityPreferences,
          fontSize: "giant" as never,
        },
      }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({
        userId: "user-1",
        preferences: {
          ...defaultAccessibilityPreferences,
          fontSize: "giant" as never,
        },
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "ACCESSIBILITY_FONT_SIZE_INVALID" }),
    );
  });
});
