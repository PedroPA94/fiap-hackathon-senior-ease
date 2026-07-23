import type { EntityId, ISODateTimeString } from "../types/index.js";
import { assertNonEmpty, normalizeRequiredText } from "../validation/index.js";

export type UserProfile = {
  id: EntityId;
  name: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CreateUserProfileInput = {
  id: EntityId;
  name: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export function createUserProfile(input: CreateUserProfileInput): UserProfile {
  assertNonEmpty(input.id, "USER_PROFILE_ID_REQUIRED");
  assertNonEmpty(input.createdAt, "USER_PROFILE_CREATED_AT_REQUIRED");
  assertNonEmpty(input.updatedAt, "USER_PROFILE_UPDATED_AT_REQUIRED");

  return {
    id: input.id,
    name: normalizeRequiredText(input.name, "USER_PROFILE_NAME_REQUIRED"),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
