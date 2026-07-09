import { describe, expect, it } from "vitest";

import {
  createUserProfile,
  DomainError,
  type CreateUserProfileInput,
} from "../../../src/domain";

const createdAt = "2026-07-09T12:00:00.000Z";
const updatedAt = "2026-07-09T12:00:00.000Z";

function makeInput(
  overrides: Partial<CreateUserProfileInput> = {},
): CreateUserProfileInput {
  return {
    id: "user-1",
    name: "Maria Silva",
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function expectDomainError(fn: () => unknown, code: string): void {
  expect(fn).toThrow(DomainError);
  expect(fn).toThrow(expect.objectContaining({ code }));
}

describe("UserProfile entity", () => {
  it("creates a valid UserProfile", () => {
    const profile = createUserProfile(makeInput());

    expect(profile).toEqual({
      id: "user-1",
      name: "Maria Silva",
      createdAt,
      updatedAt,
    });
  });

  it("normalizes name with trim", () => {
    const profile = createUserProfile(makeInput({ name: "  Maria Silva  " }));

    expect(profile.name).toBe("Maria Silva");
  });

  it("rejects an empty id", () => {
    expectDomainError(
      () => createUserProfile(makeInput({ id: "" })),
      "USER_PROFILE_ID_REQUIRED",
    );
  });

  it("rejects an empty name", () => {
    expectDomainError(
      () => createUserProfile(makeInput({ name: "   " })),
      "USER_PROFILE_NAME_REQUIRED",
    );
  });

  it("rejects an empty createdAt", () => {
    expectDomainError(
      () => createUserProfile(makeInput({ createdAt: "" })),
      "USER_PROFILE_CREATED_AT_REQUIRED",
    );
  });

  it("rejects an empty updatedAt", () => {
    expectDomainError(
      () => createUserProfile(makeInput({ updatedAt: "" })),
      "USER_PROFILE_UPDATED_AT_REQUIRED",
    );
  });
});
