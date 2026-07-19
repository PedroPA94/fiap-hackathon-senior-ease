import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Activity, ISODateTimeString } from '@senior-ease/core';
import { catchError, EMPTY, finalize } from 'rxjs';
import { Button } from '../../shared/ui/button/button';
import { Card } from '../../shared/ui/card/card';
import { InlineAlert } from '../../shared/feedback/inline-alert/inline-alert';
import { ActivityService } from '../../../application/services/activity.service';
import { formatRelativeDate } from '../../shared/utils/format-relative-date';

@Component({
  selector: 'se-home',
  standalone: true,
  imports: [RouterLink, Button, Card, InlineAlert],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly recentActivities = signal<Activity[]>([]);
  protected readonly isRecentActivitiesLoading = signal(false);
  protected readonly recentActivitiesError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRecentActivities();
  }

  protected loadRecentActivities(): void {
    if (this.isRecentActivitiesLoading()) {
      return;
    }

    this.isRecentActivitiesLoading.set(true);
    this.recentActivitiesError.set(null);

    this.activityService
      .getRecentCompletedActivities()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.recentActivities.set([]);

          this.recentActivitiesError.set('Não foi possível carregar o histórico recente.');

          return EMPTY;
        }),
        finalize(() => {
          this.isRecentActivitiesLoading.set(false);
        }),
      )
      .subscribe((activities) => {
        this.recentActivities.set(activities);
      });
  }

  protected formatCompletionDate(dateTime: ISODateTimeString): string {
    return formatRelativeDate(dateTime, new Date());
  }
}
