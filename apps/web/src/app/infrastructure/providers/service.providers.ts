import type { Provider } from '@angular/core';

import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import { BrowserClock } from '../services/browser-clock';
import { BrowserIdGenerator } from '../services/browser-id-generator';

export const serviceProviders: Provider[] = [
  {
    provide: CLOCK,
    useClass: BrowserClock,
  },
  {
    provide: ID_GENERATOR,
    useClass: BrowserIdGenerator,
  },
];
