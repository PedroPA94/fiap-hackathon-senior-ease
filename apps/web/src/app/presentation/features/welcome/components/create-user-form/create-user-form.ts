import { Component, input, output } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { TextInput } from '../../../../shared/ui/text-input/text-input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'se-create-user-form',
  imports: [Button, TextInput, ReactiveFormsModule],
  templateUrl: './create-user-form.html',
  styleUrl: './create-user-form.scss',
})
export class CreateUserForm {
  readonly submitting = input(false);
  submitted = output<string>();

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
  });

  submit() {
    if (this.form.valid) {
      this.submitted.emit(this.form.value.name!);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
