import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matArrowBackRound } from '@ng-icons/material-symbols/round';
import {
  ApplicationError,
  getActivityProgress,
  getActivityStepsView,
  getCurrentActivityStep,
  resolveActivityStatus,
  type Activity,
  type EntityId,
} from '@senior-ease/core';
import {
  catchError,
  defer,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  finalize,
  map,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  type Observable,
} from 'rxjs';

import { ActivityService } from '../../../../../application/services/activity.service';
import { ThemeService } from '../../../../../application/services/theme.service';
import { ConfirmationDialog } from '../../../../shared/feedback/confirmation-dialog/confirmation-dialog';
import { InlineAlert } from '../../../../shared/feedback/inline-alert/inline-alert';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { formatDateOnlyLongPtBr } from '../../../../shared/utils/format-date-only';
import { ActivityStepItem } from '../../components/activity-step-item/activity-step-item';
import { getActivityStatusLabel } from '../../utils/activity-status-label';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; activity: Activity }
  | { kind: 'notFound' }
  | { kind: 'error' };

type ActivityUpdateAction = { type: 'step'; stepId: EntityId } | { type: 'complete' };

type ProcessingAction = ActivityUpdateAction | { type: 'delete' };

type ConfirmationAction = 'complete' | 'delete';

@Component({
  selector: 'se-activity-details',
  imports: [
    RouterLink,
    NgIcon,
    ActivityStepItem,
    Button,
    Card,
    ConfirmationDialog,
    InlineAlert,
    NgTemplateOutlet,
  ],
  providers: [provideIcons({ matArrowBackRound })],
  templateUrl: './activity-details.html',
  styleUrl: './activity-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activityService = inject(ActivityService);
  private readonly themeService = inject(ThemeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly retryLoad$ = new Subject<void>();
  private readonly cancelPendingActions$ = new Subject<void>();
  private readonly stepItems = viewChildren(ActivityStepItem);
  private readonly feedbackRef = viewChild('feedback', { read: ElementRef });
  private readonly statusRef = viewChild<ElementRef<HTMLElement>>('activityStatus');

  protected readonly currentActivityId = signal<EntityId | null>(null);
  protected readonly loadState = signal<LoadState>({ kind: 'loading' });
  protected readonly processingAction = signal<ProcessingAction | null>(null);
  protected readonly confirmationAction = signal<ConfirmationAction | null>(null);
  protected readonly actionErrorMessage = signal<string | null>(null);
  protected readonly positiveMessage = signal<string | null>(null);

  protected readonly activityView = computed(() => {
    const state = this.loadState();

    if (state.kind !== 'ready') {
      return null;
    }

    const status = resolveActivityStatus(state.activity);
    const progress = getActivityProgress(state.activity);

    return {
      activity: state.activity,
      status,
      statusLabel: getActivityStatusLabel(status),
      progress,
      progressLabel: `${progress.completedSteps} de ${progress.totalSteps} etapas concluídas`,
      steps: getActivityStepsView(state.activity),
    };
  });

  protected readonly currentStepEntry = computed(() => {
    const view = this.activityView();

    if (!view) {
      return null;
    }

    const position = view.steps.findIndex((step) => step.viewStatus === 'current');

    if (position < 0) {
      return null;
    }

    return {
      step: view.steps[position],
      position: position + 1,
    };
  });

  protected readonly basicProgressLabel = computed(() => {
    const view = this.activityView();
    const currentStep = this.currentStepEntry();

    if (!view) {
      return '';
    }

    if (view.status === 'completed') {
      return 'Todas as etapas foram concluídas.';
    }

    if (!currentStep) {
      return view.progressLabel;
    }

    return `Etapa ${currentStep.position} de ${view.progress.totalSteps}`;
  });

  protected readonly isProcessing = computed(() => this.processingAction() !== null);
  protected readonly dialogConfig = computed(() => {
    const action = this.confirmationAction();

    if (!action) {
      return null;
    }

    return action === 'delete'
      ? {
          title: 'Excluir atividade?',
          description: 'Essa atividade será removida da sua lista.',
          confirmLabel: 'Excluir',
          variant: 'danger' as const,
        }
      : {
          title: 'Concluir atividade?',
          description: 'Todas as etapas serão marcadas como concluídas.',
          confirmLabel: 'Concluir atividade',
          variant: 'default' as const,
        };
  });

  protected readonly interfaceMode = this.themeService.interfaceMode;
  protected readonly isAdvancedMode = computed(() => this.interfaceMode() === 'advanced');

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('activityId')?.trim() || null),
        distinctUntilChanged(),
        tap((activityId) => this.prepareForActivity(activityId)),
        switchMap((activityId) => {
          if (!activityId) {
            this.loadState.set({ kind: 'error' });
            return EMPTY;
          }

          return this.retryLoad$.pipe(
            startWith(undefined),
            exhaustMap(() => this.loadActivity(activityId)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((activity) => this.setActivity(activity));
  }

  protected retryLoad(): void {
    if (this.loadState().kind !== 'loading' && this.currentActivityId()) {
      this.retryLoad$.next();
    }
  }

  protected completeStep(stepId: EntityId): void {
    const view = this.activityView();
    const activityId = this.currentActivityId();
    const currentStep = view ? getCurrentActivityStep(view.activity) : null;

    if (!view || !activityId || currentStep?.id !== stepId || this.isProcessing()) {
      return;
    }

    this.updateActivity(
      { type: 'step', stepId },
      this.activityService.completeActivityStep(activityId, stepId),
      'Não foi possível concluir a etapa. Tente novamente.',
    );
  }

  protected requestCompleteActivity(): void {
    if (this.activityView()?.status === 'completed' || this.isProcessing()) {
      return;
    }

    this.requestCriticalAction('complete');
  }

  protected requestDelete(): void {
    if (!this.isProcessing()) {
      this.requestCriticalAction('delete');
    }
  }

  protected cancelConfirmation(): void {
    if (!this.isProcessing()) {
      this.confirmationAction.set(null);
    }
  }

  protected confirmAction(): void {
    const action = this.confirmationAction();

    if (!action || this.isProcessing()) {
      return;
    }

    if (action === 'complete') {
      this.completeEntireActivity();
    } else {
      this.deleteActivity();
    }
  }

  protected readonly formatDate = formatDateOnlyLongPtBr;

  protected isStepProcessing(stepId: EntityId): boolean {
    const action = this.processingAction();
    return action?.type === 'step' && action.stepId === stepId;
  }

  protected isProcessingAction(type: 'complete' | 'delete'): boolean {
    return this.processingAction()?.type === type;
  }

  private prepareForActivity(activityId: EntityId | null): void {
    this.cancelPendingActions$.next();
    this.currentActivityId.set(activityId);
    this.loadState.set({ kind: 'loading' });
    this.processingAction.set(null);
    this.actionErrorMessage.set(null);
    this.positiveMessage.set(null);
    this.confirmationAction.set(null);
  }

  private loadActivity(activityId: EntityId): Observable<Activity> {
    return defer(() => {
      this.loadState.set({ kind: 'loading' });

      return this.activityService.getActivityById(activityId);
    }).pipe(
      catchError((error: unknown) => {
        this.loadState.set({
          kind:
            error instanceof ApplicationError && error.code === 'ACTIVITY_NOT_FOUND'
              ? 'notFound'
              : 'error',
        });

        return EMPTY;
      }),
    );
  }

  private requestCriticalAction(action: ConfirmationAction): void {
    if (this.themeService.confirmCriticalActions()) {
      this.confirmationAction.set(action);
    } else if (action === 'complete') {
      this.completeEntireActivity();
    } else {
      this.deleteActivity();
    }
  }

  private completeEntireActivity(): void {
    const activityId = this.currentActivityId();

    if (!activityId || this.activityView()?.status === 'completed' || this.isProcessing()) {
      return;
    }

    this.updateActivity(
      { type: 'complete' },
      this.activityService.completeActivity(activityId),
      'Não foi possível concluir a atividade. Tente novamente.',
    );
  }

  private deleteActivity(): void {
    const activityId = this.currentActivityId();

    if (!activityId || this.isProcessing()) {
      return;
    }

    this.processingAction.set({ type: 'delete' });
    this.clearActionFeedback();

    this.activityService
      .deleteActivity(activityId)
      .pipe(
        takeUntil(this.cancelPendingActions$),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.actionErrorMessage.set('Não foi possível excluir a atividade. Tente novamente.');
          return EMPTY;
        }),
        finalize(() => {
          this.processingAction.set(null);
          this.confirmationAction.set(null);
        }),
      )
      .subscribe(() => {
        this.toastService.success('Atividade excluída com sucesso.');
        void this.router.navigate(['/activities']);
      });
  }

  private setActivity(activity: Activity): void {
    this.loadState.set({ kind: 'ready', activity });
  }

  private updateActivity(
    action: ActivityUpdateAction,
    request: Observable<Activity>,
    errorMessage: string,
  ): void {
    this.processingAction.set(action);
    this.clearActionFeedback();

    request
      .pipe(
        takeUntil(this.cancelPendingActions$),
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.actionErrorMessage.set(errorMessage);
          return EMPTY;
        }),
        finalize(() => {
          this.processingAction.set(null);

          if (action.type === 'complete') {
            this.confirmationAction.set(null);
          }
        }),
      )
      .subscribe((activity) => this.handleCompletion(activity));
  }

  private handleCompletion(activity: Activity): void {
    const activityCompleted = resolveActivityStatus(activity) === 'completed';
    const message = activityCompleted
      ? 'Atividade concluída com sucesso.'
      : 'Etapa concluída com sucesso.';

    this.setActivity(activity);
    this.toastService.success(message);

    if (this.themeService.enhancedFeedback()) {
      this.positiveMessage.set(message);
    }

    this.focusAfterCompletion();
  }

  private clearActionFeedback(): void {
    this.actionErrorMessage.set(null);
    this.positiveMessage.set(null);
  }

  private focusAfterCompletion(): void {
    afterNextRender(
      () => {
        const currentStep = this.stepItems().find(
          (stepItem) => stepItem.step().viewStatus === 'current',
        );

        if (currentStep) {
          currentStep.focus();
          return;
        }

        const target = this.feedbackRef()?.nativeElement ?? this.statusRef()?.nativeElement;
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
