import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  GetUserProfileUseCase,
} from "../../../src/application";
import { createUserProfile, DomainError } from "../../../src/domain";
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
  const repository = new InMemoryUserProfileRepository();
  const useCase = new GetUserProfileUseCase(repository);

  return { repository, useCase };
}

describe("GetUserProfileUseCase", () => {
  it("returns an existing profile", async () => {
    const { repository, useCase } = makeUseCase();
    const profile = makeProfile();
    await repository.create(profile);

    await expect(useCase.execute({ id: "user-1" })).resolves.toBe(profile);
  });

  it("throws DomainError when id is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ id: "" })).rejects.toThrow(DomainError);
    await expect(useCase.execute({ id: "" })).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_ID_REQUIRED" }),
    );
  });

  it("throws ApplicationError USER_PROFILE_NOT_FOUND when profile does not exist", async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ id: "missing-user" })).rejects.toThrow(
      ApplicationError,
    );
    await expect(useCase.execute({ id: "missing-user" })).rejects.toThrow(
      expect.objectContaining({ code: "USER_PROFILE_NOT_FOUND" }),
    );
  });
});
