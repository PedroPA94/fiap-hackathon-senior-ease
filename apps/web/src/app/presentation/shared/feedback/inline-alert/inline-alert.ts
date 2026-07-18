import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type InlineAlertVariant = 'error' | 'success' | 'info';

@Component({
  selector: 'se-inline-alert',
  templateUrl: './inline-alert.html',
  styleUrl: './inline-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineAlert {
  readonly variant = input<InlineAlertVariant>('info');
}
