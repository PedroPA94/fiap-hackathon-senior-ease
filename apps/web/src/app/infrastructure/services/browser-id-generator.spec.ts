import { TestBed } from '@angular/core/testing';

import { BrowserIdGenerator } from './browser-id-generator';

describe('BrowserIdGenerator', () => {
  const uuid = '00000000-0000-4000-8000-000000000000';

  let service: BrowserIdGenerator;
  let randomUUIDMock: ReturnType<typeof vi.fn<Crypto['randomUUID']>>;

  beforeEach(() => {
    randomUUIDMock = vi.fn<Crypto['randomUUID']>().mockReturnValue(uuid);

    vi.stubGlobal('crypto', {
      randomUUID: randomUUIDMock,
    });

    TestBed.configureTestingModule({
      providers: [BrowserIdGenerator],
    });

    service = TestBed.inject(BrowserIdGenerator);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a user id from a random UUID', () => {
    expect(service.generate()).toBe(`usr_${uuid}`);
    expect(randomUUIDMock).toHaveBeenCalledOnce();
  });
});
