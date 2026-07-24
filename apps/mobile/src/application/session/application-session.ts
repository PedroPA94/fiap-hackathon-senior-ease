import type {
  EntityId,
  ISODateTimeString,
  UserProfile,
} from "@senior-ease/core";

export type LocalUserSummary = Readonly<{
  id: EntityId;
  name: string;
  lastAccessedAt: ISODateTimeString;
}>;

type SessionWithCurrentUser = Readonly<{
  users: readonly LocalUserSummary[];
  currentUser: UserProfile;
}>;

export type ApplicationSessionSnapshot =
  | Readonly<{
      status: "noProfiles";
      users: readonly [];
      currentUser: null;
    }>
  | Readonly<{
      status: "profileSelectionRequired";
      users: readonly LocalUserSummary[];
      currentUser: null;
    }>
  | (SessionWithCurrentUser & Readonly<{ status: "onboardingRequired" }>)
  | (SessionWithCurrentUser & Readonly<{ status: "ready" }>);

export interface ApplicationSessionStore {
  getCurrentUserId(): Promise<EntityId | null>;
  setCurrentUserId(userId: EntityId): Promise<void>;
  clearCurrentUserId(): Promise<void>;
  listUsers(): Promise<readonly LocalUserSummary[]>;
  upsertUser(user: LocalUserSummary): Promise<void>;
  removeUser(userId: EntityId): Promise<void>;
  isOnboardingCompleted(userId: EntityId): Promise<boolean>;
  markOnboardingCompleted(userId: EntityId): Promise<void>;
}
