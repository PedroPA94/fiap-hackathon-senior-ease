import type { EntityId } from "../../domain/index.js";

export interface IdGenerator {
  generate(): EntityId;
}
