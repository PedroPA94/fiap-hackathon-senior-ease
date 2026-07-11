import type { EntityId, ISODateTimeString } from '@senior-ease/core';

export type LocalUser = {
  id: EntityId;
  name: string;
  lastAccessedAt: ISODateTimeString;
};
