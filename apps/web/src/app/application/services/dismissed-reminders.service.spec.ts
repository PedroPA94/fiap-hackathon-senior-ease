import { TestBed } from '@angular/core/testing';
import type { Signal } from '@angular/core';
import type { EntityId } from '@senior-ease/core';

import { DismissedRemindersService } from './dismissed-reminders.service';

describe('DismissedRemindersService', () => {
  let service: DismissedRemindersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DismissedRemindersService);
  });

  it('starts empty and exposes readonly IDs', () => {
    expectTypeOf(service.ids).toEqualTypeOf<Signal<ReadonlySet<EntityId>>>();
    expect([...service.ids()]).toEqual([]);
  });

  it('dismisses different activity IDs without mutating the previous Set', () => {
    const initialIds = service.ids();

    service.dismiss('activity-1');
    const firstDismissalIds = service.ids();
    service.dismiss('activity-2');

    expect(initialIds.size).toBe(0);
    expect(firstDismissalIds).not.toBe(initialIds);
    expect([...firstDismissalIds]).toEqual(['activity-1']);
    expect(service.ids()).not.toBe(firstDismissalIds);
    expect([...service.ids()]).toEqual(['activity-1', 'activity-2']);
  });

  it('keeps a single entry when the same activity is dismissed again', () => {
    service.dismiss('activity-1');
    service.dismiss('activity-1');

    expect([...service.ids()]).toEqual(['activity-1']);
  });

  it('clears every dismissed activity ID', () => {
    service.dismiss('activity-1');
    service.dismiss('activity-2');

    service.clear();

    expect([...service.ids()]).toEqual([]);
  });
});
