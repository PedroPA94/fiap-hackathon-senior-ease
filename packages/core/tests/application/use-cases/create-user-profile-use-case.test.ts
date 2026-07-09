import { describe, expect, it } from "vitest";

import { CreateUserProfileUseCase } from "../../../src/application";
import { DomainError } from "../../../src/domain";
import { FakeClock } from "../../helpers/fake-clock";
import { InMemoryUserProfileRepository } from "../../helpers/in-memory-user-profile-repository";

function makeUseCase() {
  const repository = new InMemoryUserProfileRepository();
  const clock = new FakeClock();
  const useCase = new CreateUserProfileUseCase(repository, clock);

  return { repository, useCase };
}

describe("CreateUserProfileUseCase", () => {
  it("creates and persists a UserProfile", async () => {
    const { repository, useCase } = makeUseCase();

    const profile = await useCase.execute({
      id: "user-1",
      name: "Maria Silva",
    });

    await expect(repository.findById("user-1")).resolves.toBe(profile);
  });

  it("uses clock.now() for createdAt and updatedAt", async () => {
    const { useCase } = makeUseCase();

    const profile = await useCase.execute({
      id: "user-1",
      name: "Maria Silva",
    });

    expect(profile.createdAt).toBe("2026-07-09T12:00:00.000Z");
    expect(profile.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });

  it("normalizes name through the domain", async () => {
    const { useCase } = makeUseCase();

    const profile = await useCase.execute({
      id: "user-1",
      name: "  Maria Silva  ",
    });

    expect(profile.name).toBe("Maria Silva");
  });

  it("propagates DomainError for empty name", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ id: "user-1", name: "   " }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({ id: "user-1", name: "   " }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_NAME_REQUIRED" }),
    );
  });

  it("propagates DomainError for empty id", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ id: "", name: "Maria Silva" }),
    ).rejects.toThrow(DomainError);
    await expect(
      useCase.execute({ id: "", name: "Maria Silva" }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_ID_REQUIRED" }),
    );
  });
});
