import type { IdGenerator } from "../../src/application";
import type { EntityId } from "../../src/domain";

export class SequentialIdGenerator implements IdGenerator {
  private nextId = 1;

  generate(): EntityId {
    const id = `id-${this.nextId}`;
    this.nextId += 1;

    return id;
  }
}
