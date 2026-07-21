import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getActivityProgress, resolveActivityStatus, type Activity } from '@senior-ease/core';

import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { formatDateOnlyLongPtBr } from '../../../../shared/utils/format-date-only';
import { getActivityStatusLabel } from '../../utils/activity-status-label';

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
  protected readonly statusLabel = computed(() => getActivityStatusLabel(this.status()));
  protected readonly progress = computed(() => getActivityProgress(this.activity()));

  protected readonly formatDate = formatDateOnlyLongPtBr;
}
