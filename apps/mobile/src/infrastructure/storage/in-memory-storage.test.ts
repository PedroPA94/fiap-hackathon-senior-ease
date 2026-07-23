import { InMemoryStorage } from "./in-memory-storage";

describe("InMemoryStorage", () => {
  it("returns null for an unknown key", async () => {
    const storage = new InMemoryStorage();

    await expect(storage.getItem("missing")).resolves.toBeNull();
  });

  it("accepts initial values without exposing mutable state", async () => {
    const initialItems = { greeting: "hello" };
    const storage = new InMemoryStorage(initialItems);

    initialItems.greeting = "changed";

    await expect(storage.getItem("greeting")).resolves.toBe("hello");
  });

  it("stores and replaces values", async () => {
    const storage = new InMemoryStorage();

    await storage.setItem("key", "first");
    await storage.setItem("key", "second");

    await expect(storage.getItem("key")).resolves.toBe("second");
  });

  it("removes values idempotently", async () => {
    const storage = new InMemoryStorage({ key: "value" });

    await storage.removeItem("key");
    await storage.removeItem("key");

    await expect(storage.getItem("key")).resolves.toBeNull();
  });
});
