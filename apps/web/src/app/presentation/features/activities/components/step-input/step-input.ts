import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matArrowDownwardRound,
  matArrowUpwardRound,
  matDeleteForeverFillRound,
} from '@ng-icons/material-symbols/round';

import { Button } from '../../../../shared/ui/button/button';

export type ActivityStepsFormArray = FormArray<FormControl<string>>;

export function createActivityStepControl(value = ''): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
}

@Component({
  selector: 'se-step-input',
  imports: [Button, NgIcon, ReactiveFormsModule],
  providers: [
    provideIcons({ matArrowUpwardRound, matArrowDownwardRound, matDeleteForeverFillRound }),
  ],
  templateUrl: './step-input.html',
  styleUrl: './step-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepInput {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly steps = input.required<ActivityStepsFormArray>();
  readonly controlId = input('activity-steps');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly reorderable = input(true, {
    transform: booleanAttribute,
  });

  protected addStep(): void {
    if (this.disabled()) {
      return;
    }

    const nextIndex = this.steps().length;
    this.steps().push(createActivityStepControl());

    queueMicrotask(() => this.focusStep(nextIndex));
  }

  protected removeStep(index: number): void {
    if (this.disabled() || this.steps().length === 1) {
      return;
    }

    this.steps().removeAt(index);
  }

  protected moveStep(index: number, targetIndex: number): void {
    const steps = this.steps();

    if (
      this.disabled() ||
      index < 0 ||
      index >= steps.length ||
      targetIndex < 0 ||
      targetIndex >= steps.length
    ) {
      return;
    }

    const control = steps.at(index);
    steps.removeAt(index);
    steps.insert(targetIndex, control);
  }

  protected stepId(index: number): string {
    return `${this.controlId()}-${index}`;
  }

  protected errorId(index: number): string {
    return `${this.stepId(index)}-error`;
  }

  protected showError(index: number): boolean {
    const control = this.steps().at(index);

    return control.invalid && control.touched;
  }

  private focusStep(index: number): void {
    this.elementRef.nativeElement
      .querySelector<HTMLInputElement>(`#${this.stepId(index)}`)
      ?.focus();
  }
}
