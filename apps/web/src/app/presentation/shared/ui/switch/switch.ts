import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'se-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Switch),
      multi: true,
    },
  ],
})
export class Switch implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();

  protected readonly checked = signal(false);

  private onChange: (checked: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected handleChange(event: Event): void {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }

    this.checked.set(inputElement.checked);
    this.onChange(inputElement.checked);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: boolean | null | undefined): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(callback: (checked: boolean) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }
}
