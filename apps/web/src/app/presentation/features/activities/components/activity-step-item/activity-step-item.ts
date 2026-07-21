import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound } from '@ng-icons/material-symbols/round';
import type { ActivityStepView, EntityId } from '@senior-ease/core';

import { Button } from '../../../../shared/ui/button/button';

@Component({
  selector: 'se-activity-step-item',
  imports: [Button, NgIcon],
  providers: [provideIcons({ matCheckRound })],
  templateUrl: './activity-step-item.html',
  styleUrl: './activity-step-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityStepItem {
  private readonly itemRef = viewChild.required<ElementRef<HTMLElement>>('item');

  readonly step = input.required<ActivityStepView>();
  readonly position = input.required<number>();
  readonly loading = input(false);
  readonly actionsDisabled = input(false);

  readonly completionRequested = output<EntityId>();

  focus(): void {
    this.itemRef().nativeElement.focus();
  }

  protected readonly statusLabel = computed(() => {
    const labels = {
      completed: 'Concluída',
      current: 'Etapa atual',
      pending: 'Pendente',
    } as const;

    return labels[this.step().viewStatus];
  });

  protected requestCompletion(): void {
    if (this.step().viewStatus !== 'current' || this.loading() || this.actionsDisabled()) {
      return;
    }

    this.completionRequested.emit(this.step().id);
  }
}
