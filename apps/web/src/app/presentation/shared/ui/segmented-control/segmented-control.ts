import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type SegmentedControlOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'se-segmented-control',
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControl),
      multi: true,
    },
  ],
})
export class SegmentedControl implements ControlValueAccessor {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly SegmentedControlOption[]>();

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected optionId(index: number): string {
    return `${this.controlId()}-option-${index}`;
  }

  protected selectOption(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected markAsTouched(): void {
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
