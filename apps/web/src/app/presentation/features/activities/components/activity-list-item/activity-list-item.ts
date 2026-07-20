import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  getActivityProgress,
  resolveActivityStatus,
  type Activity,
  type ActivityStatus,
  type DateOnlyString,
} from '@senior-ease/core';

import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';

const STATUS_LABELS: Readonly<Record<ActivityStatus, string>> = {
  pending: 'Não iniciada',
  inProgress: 'Em andamento',
  completed: 'Concluída',
};

@Component({
  selector: 'se-activity-list-item',
  imports: [RouterLink, Button, Card],
  templateUrl: './activity-list-item.html',
  styleUrl: './activity-list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityListItem {
  readonly activity = input.required<Activity>();

  protected readonly status = computed(() => resolveActivityStatus(this.activity()));
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly progress = computed(() => getActivityProgress(this.activity()));

  protected formatDate(dateOnly: DateOnlyString): string {
    const [year, month, day] = dateOnly.split('-').map(Number);

    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }
}
