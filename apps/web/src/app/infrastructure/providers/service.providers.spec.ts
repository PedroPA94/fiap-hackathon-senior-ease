import { TestBed } from '@angular/core/testing';

import { CLOCK, ID_GENERATOR } from '../../core/tokens/service.tokens';
import { BrowserClock } from '../services/browser-clock';
import { BrowserIdGenerator } from '../services/browser-id-generator';
import { serviceProviders } from './service.providers';

describe('serviceProviders', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: serviceProviders,
    });
  });

  it('should provide the browser clock', () => {
    expect(TestBed.inject(CLOCK)).toBeInstanceOf(BrowserClock);
  });

  it('should provide the browser id generator', () => {
    expect(TestBed.inject(ID_GENERATOR)).toBeInstanceOf(BrowserIdGenerator);
  });
});
