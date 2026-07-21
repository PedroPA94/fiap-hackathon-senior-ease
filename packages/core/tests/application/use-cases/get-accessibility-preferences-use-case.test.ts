import { describe, expect, it } from "vitest";

import { GetAccessibilityPreferencesUseCase } from "../../../src/application";
import { defaultAccessibilityPreferences, DomainError } from "../../../src/domain";
import { InMemoryAccessibilityPreferencesRepository } from "../../helpers/in-memory-accessibility-preferences-repository";

function makeUseCase() {
  const repository = new InMemoryAccessibilityPreferencesRepository();
  const useCase = new GetAccessibilityPreferencesUseCase(repository);

  return { repository, useCase };
}

describe("GetAccessibilityPreferencesUseCase", () => {
  it("returns saved preferences when they exist", async () => {
    const { repository, useCase } = makeUseCase();
    const preferences = {
      fontSize: "large",
      contrast: "high",
      spacing: "wide",
      interfaceMode: "advanced",
      enhancedFeedback: false,
      confirmCriticalActions: false,
      remindersEnabled: true,
      reminderAdvance: "oneHour",
    } as const;
    await repository.save("user-1", preferences);

    await expect(useCase.execute({ userId: "user-1" })).resolves.toBe(
      preferences,
    );
  });

  it("returns defaultAccessibilityPreferences when preferences do not exist", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ userId: "user-1" })).resolves.toBe(
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
