import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline';

export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'se-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');

  readonly type = input<ButtonType>('button');

  readonly disabled = input(false, {
    transform: booleanAttribute,
  });

  readonly loading = input(false, {
    transform: booleanAttribute,
  });

  readonly fullWidth = input(true, {
    transform: booleanAttribute,
  });

  readonly ariaLabel = input<string | null>(null);

  protected isDisabled(): boolean {
    return this.disabled() || this.loading();
  }
}
