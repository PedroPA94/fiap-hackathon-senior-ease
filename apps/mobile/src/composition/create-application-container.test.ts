import {
  CompleteActivityStepUseCase,
  CompleteActivityUseCase,
  CreateActivityUseCase,
  CreateUserProfileUseCase,
  DeleteActivityUseCase,
  GetAccessibilityPreferencesUseCase,
  GetActivityByIdUseCase,
  GetHomeActivityOverviewUseCase,
  GetUserExperienceProfileUseCase,
  GetUserProfileUseCase,
  ListActivitiesByUserUseCase,
  ResetAccessibilityPreferencesUseCase,
  UpdateAccessibilityPreferencesUseCase,
  type Clock,
  type IdGenerator,
} from "@senior-ease/core";

import { ApplicationSessionService } from "../application/session";
import { LocalSessionStore } from "../infrastructure/session";
import { InMemoryStorage } from "../infrastructure/storage";
import { createApplicationContainer } from "./create-application-container";

const fixedClock: Clock = {
  now: () => "2026-07-23T12:00:00.000Z",
  today: () => "2026-07-23",
};

describe("createApplicationContainer", () => {
  it("creates the default repositories and every public use case", () => {
    const container = createApplicationContainer();

    expect(container.repositories.activities).toBeDefined();
    expect(container.repositories.userProfiles).toBeDefined();
    expect(container.repositories.accessibilityPreferences).toBeDefined();
    expect(container.stores.session).toBeInstanceOf(LocalSessionStore);
    expect(container.services.session).toBeInstanceOf(
      ApplicationSessionService,
    );

    expect(container.useCases.activities.create).toBeInstanceOf(
      CreateActivityUseCase,
    );
    expect(container.useCases.activities.listByUser).toBeInstanceOf(
      ListActivitiesByUserUseCase,
    );
    expect(container.useCases.activities.getById).toBeInstanceOf(
      GetActivityByIdUseCase,
    );
    expect(container.useCases.activities.getHomeOverview).toBeInstanceOf(
      GetHomeActivityOverviewUseCase,
    );
    expect(container.useCases.activities.complete).toBeInstanceOf(
      CompleteActivityUseCase,
    );
    expect(container.useCases.activities.completeStep).toBeInstanceOf(
      CompleteActivityStepUseCase,
    );
    expect(container.useCases.activities.delete).toBeInstanceOf(
      DeleteActivityUseCase,
    );
    expect(container.useCases.userProfiles.create).toBeInstanceOf(
      CreateUserProfileUseCase,
    );
    expect(container.useCases.userProfiles.get).toBeInstanceOf(
      GetUserProfileUseCase,
    );
    expect(container.useCases.userProfiles.getExperience).toBeInstanceOf(
      GetUserExperienceProfileUseCase,
    );
    expect(container.useCases.accessibilityPreferences.get).toBeInstanceOf(
      GetAccessibilityPreferencesUseCase,
    );
    expect(container.useCases.accessibilityPreferences.update).toBeInstanceOf(
      UpdateAccessibilityPreferencesUseCase,
    );
    expect(container.useCases.accessibilityPreferences.reset).toBeInstanceOf(
      ResetAccessibilityPreferencesUseCase,
    );
  });

  it("uses the storage, clock, and id generator overrides", async () => {
    const storage = new InMemoryStorage();
    const idGenerator: IdGenerator = {
      generate: jest
        .fn<ReturnType<IdGenerator["generate"]>, []>()
        .mockReturnValueOnce("activity-1")
        .mockReturnValueOnce("step-1"),
    };
    const container = createApplicationContainer({
      storage,
      clock: fixedClock,
      idGenerator,
    });

    const created = await container.useCases.activities.create.execute({
      userId: "user-1",
      title: "Consulta",
      date: "2026-07-23",
      steps: ["Levar documentos"],
    });
    const stored = await container.repositories.activities.findById({
      userId: "user-1",
      activityId: "activity-1",
    });

    expect(stored).toEqual(created);
    expect(created).toMatchObject({
      id: "activity-1",
      createdAt: "2026-07-23T12:00:00.000Z",
      updatedAt: "2026-07-23T12:00:00.000Z",
      steps: [
        {
          id: "step-1",
          description: "Levar documentos",
        },
      ],
    });
  });

  it("keeps containers isolated", async () => {
    const firstContainer = createApplicationContainer({
      storage: new InMemoryStorage(),
      clock: fixedClock,
    });
    const secondContainer = createApplicationContainer({
      storage: new InMemoryStorage(),
      clock: fixedClock,
    });

    await firstContainer.useCases.userProfiles.create.execute({
      id: "user-1",
      name: "Maria",
    });

    await expect(
      firstContainer.useCases.userProfiles.get.execute({ id: "user-1" }),
    ).resolves.toMatchObject({ id: "user-1", name: "Maria" });
    await expect(
      secondContainer.useCases.userProfiles.get.execute({ id: "user-1" }),
    ).rejects.toMatchObject({ code: "USER_PROFILE_NOT_FOUND" });
  });

  it("reuses the storage, clock, and user profile repository in session services", async () => {
    const storage = new InMemoryStorage();
    const container = createApplicationContainer({
      storage,
      clock: fixedClock,
    });
    const profile = await container.useCases.userProfiles.create.execute({
      id: "user-1",
      name: "Maria",
    });
    const findById = jest.spyOn(
      container.repositories.userProfiles,
      "findById",
    );

    await container.services.session.registerProfile(profile);
    const snapshot = await container.services.session.bootstrap();

    expect(findById).toHaveBeenCalledWith(profile.id);
    expect(snapshot).toMatchObject({
      status: "onboardingRequired",
      currentUser: profile,
      users: [
        {
          id: profile.id,
          lastAccessedAt: "2026-07-23T12:00:00.000Z",
        },
      ],
    });
  });
});
