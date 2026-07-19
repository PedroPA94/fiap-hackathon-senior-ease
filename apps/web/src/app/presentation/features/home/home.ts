import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  Activity,
  HomeActivityOverview,
  ISODateTimeString,
  TodayActivitySummary,
} from '@senior-ease/core';
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

  protected readonly overview = signal<HomeActivityOverview | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly todaySummary = computed<TodayActivitySummary>(
    () =>
      this.overview()?.todaySummary ?? {
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
  );

  ngOnInit(): void {
    this.loadOverview();
  }

  protected loadOverview(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.activityService
      .getHomeOverview()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.errorMessage.set('Não foi possível carregar os dados da página inicial.');

          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe((overview) => {
        this.overview.set(overview);
      });
  }

  protected formatCompletionDate(dateTime: ISODateTimeString): string {
    return formatRelativeDate(dateTime, new Date());
  }

  protected formatActivitySchedule(activity: Activity): string {
    const [year, month, day] = activity.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);

    return activity.time ? `${formattedDate}, ${activity.time}` : formattedDate;
  }

  protected pendingLabel(count: number): string {
    return `${count} ${count === 1 ? 'pendente' : 'pendentes'}`;
  }

  protected completedLabel(count: number): string {
    return `${count} ${count === 1 ? 'concluída' : 'concluídas'}`;
  }
}
