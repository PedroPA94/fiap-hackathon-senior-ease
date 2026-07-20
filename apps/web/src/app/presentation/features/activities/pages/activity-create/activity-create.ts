import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ApplicationError,
  DomainError,
  getApplicationErrorMessagePtBr,
  getDomainErrorMessagePtBr,
} from '@senior-ease/core';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

import {
  ActivityService,
  type CreateCurrentUserActivityInput,
} from '../../../../../application/services/activity.service';
import { InlineAlert } from '../../../../shared/feedback/inline-alert/inline-alert';
import { ToastService } from '../../../../shared/feedback/toast/toast.service';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import {
  createActivityStepControl,
  StepInput,
  type ActivityStepsFormArray,
} from '../../components/step-input/step-input';

type ActivityCreateForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  date: FormControl<string>;
  time: FormControl<string>;
  steps: ActivityStepsFormArray;
}>;

const CREATE_ERROR_MESSAGE =
  'Não foi possível criar a atividade. Revise os dados e tente novamente.';

@Component({
  selector: 'se-activity-create',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    Card,
    InlineAlert,
    StepInput,
    TextInput,
  ],
  templateUrl: './activity-create.html',
  styleUrl: './activity-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCreate {
  private readonly activityService = inject(ActivityService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form: ActivityCreateForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    description: new FormControl('', { nonNullable: true }),
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    time: new FormControl('', { nonNullable: true }),
    steps: new FormArray([createActivityStepControl()]),
  });

  protected submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const input = this.buildInput();

    this.isSubmitting.set(true);
    this.form.disable({ emitEvent: false });

    this.activityService
      .createActivity(input)
      .pipe(
        tap((activity) => {
          this.toastService.success('Atividade criada com sucesso.');
          void this.router.navigate(['/activities', activity.id]);
        }),
        catchError((error: unknown) => {
          this.errorMessage.set(this.resolveErrorMessage(error));

          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
          this.form.enable({ emitEvent: false });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected showControlError(control: FormControl<string>): boolean {
    return control.invalid && control.touched;
  }

  private buildInput(): CreateCurrentUserActivityInput {
    const value = this.form.getRawValue();
    const description = value.description.trim();
    const time = value.time.trim();

    return {
      title: value.title.trim(),
      description: description || undefined,
      date: value.date,
      time: time || undefined,
      steps: value.steps.map((step) => step.trim()),
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof DomainError) {
      return getDomainErrorMessagePtBr(error.code);
    }

    if (error instanceof ApplicationError) {
      return getApplicationErrorMessagePtBr(error.code);
    }

    return CREATE_ERROR_MESSAGE;
  }
}
