import { Injectable } from '@angular/core';

import type { EntityId, IdGenerator } from '@senior-ease/core';

@Injectable()
export class BrowserIdGenerator implements IdGenerator {
  generate(): EntityId {
    return `usr_${crypto.randomUUID()}`;
  }
}
