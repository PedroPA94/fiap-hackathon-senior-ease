import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Activity, ActivityListFilter } from '@senior-ease/core';
import { catchError, finalize, map, merge, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { ActivityService } from '../../../../../application/services/activity.service';
import { InlineAlert } from '../../../../shared/feedback/inline-alert/inline-alert';
import { Button } from '../../../../shared/ui/button/button';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../../../../shared/ui/segmented-control/segmented-control';
import { ActivityListItem } from '../../components/activity-list-item/activity-list-item';

type ActivityFilterOption = SegmentedControlOption & { value: ActivityListFilter };

const EMPTY_MESSAGES: Readonly<Record<ActivityListFilter, string>> = {
  all: 'Você ainda não criou nenhuma atividade.',
  today: 'Você não possui atividades para hoje.',
  pending: 'Você não possui atividades não iniciadas.',
  inProgress: 'Você não possui atividades em andamento.',
  completed: 'Você ainda não concluiu nenhuma atividade.',
};

@Component({
  selector: 'se-activities',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ActivityListItem,
    Button,
    InlineAlert,
    SegmentedControl,
  ],
  templateUrl: './activities.html',
  styleUrl: './activities.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Activities implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequested = new Subject<void>();

  protected readonly filterOptions: readonly ActivityFilterOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'today', label: 'Hoje' },
    { value: 'pending', label: 'Não iniciadas' },
    { value: 'inProgress', label: 'Em andamento' },
    { value: 'completed', label: 'Concluídas' },
  ];
  protected readonly filterControl = new FormControl<ActivityListFilter>('all', {
    nonNullable: true,
  });
  protected readonly selectedFilter = signal<ActivityListFilter>('all');
  protected readonly activities = signal<readonly Activity[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const filterChanges = this.filterControl.valueChanges.pipe(
      tap((filter) => this.selectedFilter.set(filter)),
    );
    const retries = this.retryRequested.pipe(map(() => this.selectedFilter()));

    merge(filterChanges, retries)
      .pipe(
        startWith(this.selectedFilter()),
        switchMap((filter) => {
          this.isLoading.set(true);
          this.errorMessage.set(null);
          this.activities.set([]);

          return this.activityService.listActivities(filter).pipe(
            map((activities) => ({ activities, failed: false as const })),
            catchError(() => of({ activities: [] as Activity[], failed: true as const })),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result.failed) {
          this.errorMessage.set('Não foi possível carregar suas atividades.');
          return;
        }

        this.activities.set(result.activities);
      });
  }

  protected retry(): void {
    if (!this.isLoading()) {
      this.retryRequested.next();
    }
  }

  protected emptyMessage(): string {
    return EMPTY_MESSAGES[this.selectedFilter()];
  }
}
