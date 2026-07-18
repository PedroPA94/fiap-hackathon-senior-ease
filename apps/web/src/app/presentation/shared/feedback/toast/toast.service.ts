import { DestroyRef, Injectable, type Signal, inject, signal } from '@angular/core';

import type { ToastMessage, ToastVariant } from './toast.model';

const AUTO_DISMISS_DELAY = 6000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastState = signal<ToastMessage | null>(null);

  private nextId = 1;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly toast: Signal<ToastMessage | null> = this.toastState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelDismissTimer());
  }

  success(message: string): void {
    this.show(message, 'success', true);
  }

  error(message: string): void {
    this.show(message, 'error', false);
  }

  info(message: string): void {
    this.show(message, 'info', true);
  }

  dismiss(): void {
    this.cancelDismissTimer();
    this.toastState.set(null);
  }

  private show(message: string, variant: ToastVariant, autoDismiss: boolean): void {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    this.cancelDismissTimer();

    const toast: ToastMessage = {
      id: this.nextId++,
      message: normalizedMessage,
      variant,
    };

    this.toastState.set(toast);

    if (autoDismiss) {
      this.dismissTimer = setTimeout(() => {
        if (this.toastState()?.id === toast.id) {
          this.toastState.set(null);
        }

        this.dismissTimer = null;
      }, AUTO_DISMISS_DELAY);
    }
  }

  private cancelDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
