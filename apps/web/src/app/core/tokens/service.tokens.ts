import { InjectionToken } from '@angular/core';

import type { Clock, IdGenerator } from '@senior-ease/core';

export const CLOCK = new InjectionToken<Clock>('CLOCK');

export const ID_GENERATOR = new InjectionToken<IdGenerator>('ID_GENERATOR');
