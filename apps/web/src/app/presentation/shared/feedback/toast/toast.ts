import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'se-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly toastService = inject(ToastService);
  protected readonly toast = this.toastService.toast;

  protected dismiss(): void {
    this.toastService.dismiss();
  }
}
