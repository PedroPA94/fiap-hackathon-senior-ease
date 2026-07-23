import type { Storage } from "./storage";

export class InMemoryStorage implements Storage {
  private readonly items: Map<string, string>;

  constructor(initialItems: Readonly<Record<string, string>> = {}) {
    this.items = new Map(Object.entries(initialItems));
  }

  async getItem(key: string): Promise<string | null> {
    return this.items.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.items.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.items.delete(key);
  }
}
