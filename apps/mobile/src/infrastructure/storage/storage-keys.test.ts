import { storageKeys } from "./storage-keys";

describe("storageKeys", () => {
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
