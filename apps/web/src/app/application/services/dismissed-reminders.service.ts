import { Injectable, signal, type Signal } from '@angular/core';
import type { EntityId } from '@senior-ease/core';

@Injectable({ providedIn: 'root' })
export class DismissedRemindersService {
  private readonly dismissedActivityIds = signal<ReadonlySet<EntityId>>(new Set());

  readonly ids: Signal<ReadonlySet<EntityId>> = this.dismissedActivityIds.asReadonly();

  dismiss(activityId: EntityId): void {
    this.dismissedActivityIds.update((currentIds) => new Set(currentIds).add(activityId));
  }

  clear(): void {
    this.dismissedActivityIds.set(new Set());
  }
}
