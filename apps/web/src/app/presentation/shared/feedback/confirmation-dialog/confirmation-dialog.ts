import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Button } from '../../ui/button/button';

export type ConfirmationDialogVariant = 'default' | 'danger';

let nextDialogId = 1;

@Component({
  selector: 'se-confirmation-dialog',
  imports: [Button],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private previouslyFocusedElement: HTMLElement | null = null;

  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly variant = input<ConfirmationDialogVariant>('default');
  readonly processing = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = `confirmation-dialog-title-${nextDialogId}`;
  protected readonly descriptionId = `confirmation-dialog-description-${nextDialogId++}`;

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialogRef()?.nativeElement;

      if (!dialog) {
        return;
      }

      this.previouslyFocusedElement = document.activeElement as HTMLElement | null;

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }

      queueMicrotask(() => dialog.querySelector<HTMLButtonElement>('button')?.focus());
    });

    this.destroyRef.onDestroy(() => {
      const dialog = this.dialogRef()?.nativeElement;

      if (dialog?.open) {
        this.closeDialog(dialog);
      }
    });
  }

  protected cancel(event?: Event): void {
    event?.preventDefault();

    if (!this.processing()) {
      this.cancelled.emit();
    }
  }

  protected confirm(): void {
    if (!this.processing()) {
      this.confirmed.emit();
    }
  }

  private closeDialog(dialog: HTMLDialogElement): void {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }

    const previouslyFocusedElement = this.previouslyFocusedElement;
    this.previouslyFocusedElement = null;
    queueMicrotask(() => previouslyFocusedElement?.focus());
  }
}
