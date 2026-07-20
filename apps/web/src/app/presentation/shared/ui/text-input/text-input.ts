import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextInputType = 'text' | 'date' | 'time';

@Component({
  selector: 'se-text-input',
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
  ],
})
export class TextInput implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();

  readonly type = input<TextInputType>('text');
  readonly placeholder = input('');
  readonly hint = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);

  readonly required = input(false, {
    transform: booleanAttribute,
  });
  readonly autofocus = input(false, {
    transform: booleanAttribute,
  });
  readonly invalid = input(false, {
    transform: booleanAttribute,
  });

  readonly name = input<string | null>(null);
  readonly maxLength = input<number | null>(null);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected get hintId(): string {
    return `${this.inputId()}-hint`;
  }

  protected get errorId(): string {
    return `${this.inputId()}-error`;
  }

  protected get describedBy(): string | null {
    if (this.invalid() && this.errorMessage()) {
      return this.errorId;
    }

    if (this.hint()) {
      return this.hintId;
    }

    return null;
  }

  protected handleInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    this.value.set(inputElement.value);
    this.onChange(inputElement.value);
  }

  protected handleBlur(): void {
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

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
