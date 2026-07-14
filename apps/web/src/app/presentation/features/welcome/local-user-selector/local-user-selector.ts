import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { EntityId } from '@senior-ease/core';

import { Button } from '../../../shared/ui/button/button';
import { LocalUser } from '../../../../application/models/local-user';

@Component({
  selector: 'se-local-user-selector',
  imports: [Button],
  templateUrl: './local-user-selector.html',
  styleUrl: './local-user-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalUserSelector {
  readonly users = input.required<LocalUser[]>();
  readonly loadingUserId = input<EntityId | null>(null);

  readonly userSelected = output<EntityId>();
  readonly createNewRequested = output<void>();

  protected selectUser(userId: EntityId): void {
    if (this.loadingUserId()) {
      return;
    }

    this.userSelected.emit(userId);
  }

  protected requestCreateNew(): void {
    if (this.loadingUserId()) {
      return;
    }

    this.createNewRequested.emit();
  }
}
