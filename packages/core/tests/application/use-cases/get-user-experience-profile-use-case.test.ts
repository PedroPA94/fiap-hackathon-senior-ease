import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  GetUserExperienceProfileUseCase,
} from "../../../src/application";
import {
  createUserProfile,
  defaultAccessibilityPreferences,
  DomainError,
  type AccessibilityPreferences,
} from "../../../src/domain";
import { InMemoryAccessibilityPreferencesRepository } from "../../helpers/in-memory-accessibility-preferences-repository";
import { InMemoryUserProfileRepository } from "../../helpers/in-memory-user-profile-repository";

function makeProfile() {
  return createUserProfile({
    id: "user-1",
    name: "Maria Silva",
    createdAt: "2026-07-09T12:00:00.000Z",
    updatedAt: "2026-07-09T12:00:00.000Z",
  });
}

function makeUseCase() {
  const userProfileRepository = new InMemoryUserProfileRepository();
  const accessibilityPreferencesRepository =
    new InMemoryAccessibilityPreferencesRepository();
  const useCase = new GetUserExperienceProfileUseCase(
    userProfileRepository,
    accessibilityPreferencesRepository,
  );

  return {
    accessibilityPreferencesRepository,
    userProfileRepository,
    useCase,
  };
}

describe("GetUserExperienceProfileUseCase", () => {
  it("returns profile with saved accessibilityPreferences", async () => {
    const {
      accessibilityPreferencesRepository,
      userProfileRepository,
      useCase,
    } = makeUseCase();
    const profile = makeProfile();
    const preferences: AccessibilityPreferences = {
      fontSize: "large",
      contrast: "high",
      spacing: "wide",
      interfaceMode: "advanced",
      enhancedFeedback: false,
      confirmCriticalActions: false,
      remindersEnabled: true,
      reminderAdvance: "oneDay",
    };
    await userProfileRepository.create(profile);
    await accessibilityPreferencesRepository.save("user-1", preferences);

    await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
      profile,
      accessibilityPreferences: preferences,
    });
  });

  it("returns profile with defaultAccessibilityPreferences when preferences do not exist", async () => {
    const { userProfileRepository, useCase } = makeUseCase();
    const profile = makeProfile();
    await userProfileRepository.create(profile);

    await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
      profile,
      accessibilityPreferences: defaultAccessibilityPreferences,
    });
  });

  it("throws DomainError when userId is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ userId: "" })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ userId: "" })).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_ID_REQUIRED" }),
    );
  });

  it("throws ApplicationError USER_PROFILE_NOT_FOUND when profile does not exist", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ userId: "missing-user" })).rejects.toThrow(
      ApplicationError,
    );
    await expect(useCase.execute({ userId: "missing-user" })).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_NOT_FOUND" }),
    );
  });

  it("does not throw when preferences do not exist", async () => {
    const { userProfileRepository, useCase } = makeUseCase();
    await userProfileRepository.create(makeProfile());

    await expect(useCase.execute({ userId: "user-1" })).resolves.toMatchObject({
      accessibilityPreferences: defaultAccessibilityPreferences,
    });
  });
});
