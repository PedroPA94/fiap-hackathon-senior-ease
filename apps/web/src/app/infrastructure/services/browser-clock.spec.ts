import { TestBed } from '@angular/core/testing';

import { BrowserClock } from './browser-clock';

describe('BrowserClock', () => {
  const currentDate = new Date(2026, 6, 13, 9, 30, 15);

  let service: BrowserClock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(currentDate);

    TestBed.configureTestingModule({
      providers: [BrowserClock],
    });

    service = TestBed.inject(BrowserClock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the current date and time as an ISO string', () => {
    expect(service.now()).toBe(currentDate.toISOString());
  });

  it('should return the current local date only', () => {
    expect(service.today()).toBe('2026-07-13');
  });
});
