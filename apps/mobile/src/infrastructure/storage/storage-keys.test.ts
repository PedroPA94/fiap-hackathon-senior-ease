import { storageKeys } from "./storage-keys";

describe("storageKeys", () => {
  it("defines the session metadata keys", () => {
    expect(storageKeys.currentUserId).toBe("senior-ease:current-user-id");
    expect(storageKeys.userIndex).toBe("senior-ease:user-index");
    expect(storageKeys.onboardingCompleted("user-1")).toBe(
      "senior-ease:onboarding-completed:user-1",
    );
  });

  it("creates a user profile key", () => {
    expect(storageKeys.userProfile("user-1")).toBe(
      "senior-ease:user-profile:user-1",
    );
  });

  it("creates an accessibility preferences key", () => {
    expect(storageKeys.accessibilityPreferences("user-1")).toBe(
      "senior-ease:accessibility-preferences:user-1",
    );
  });

  it("creates an activities key scoped by user", () => {
    expect(storageKeys.activities("user-1")).toBe(
      "senior-ease:activities:user-1",
    );
  });
});
