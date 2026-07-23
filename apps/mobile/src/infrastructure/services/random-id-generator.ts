import type { EntityId, IdGenerator } from "@senior-ease/core";

export class RandomIdGenerator implements IdGenerator {
  generate(): EntityId {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2);

    return `id_${timestamp}_${random}`;
  }
}
