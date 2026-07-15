import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUserForm } from './create-user-form';

describe('CreateUserForm', () => {
  let component: CreateUserForm;
  let fixture: ComponentFixture<CreateUserForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUserForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the welcome form fields', () => {
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    const input = getInputElement();
    const submitButton = getSubmitButton();

    expect(heading.textContent).toContain('Vamos começar?');
    expect(input.id).toBe('user-name');
    expect(input.placeholder).toBe('Ex.: Maria Helena');
    expect(input.required).toBe(true);
    expect(submitButton.textContent).toContain('Continuar');
  });

  it('should emit the submitted name when the form is valid', () => {
    const submitted = vi.fn<(name: string) => void>();
    component.submitted.subscribe(submitted);
    fixture.detectChanges();

    const input = getInputElement();
    input.value = 'Maria Helena';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    getFormElement().dispatchEvent(new Event('submit'));

    expect(submitted).toHaveBeenCalledWith('Maria Helena');
  });

  it('should mark the name field as touched and show an error when submitting empty', () => {
    const submitted = vi.fn<(name: string) => void>();
    component.submitted.subscribe(submitted);
    fixture.detectChanges();

    getFormElement().dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.text-input__message--error') as HTMLElement;

    expect(submitted).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
    expect(getInputElement().getAttribute('aria-invalid')).toBe('true');
    expect(error.textContent).toContain('Digite seu nome para continuar.');
  });

  it('should not emit names longer than the allowed limit', () => {
    const submitted = vi.fn<(name: string) => void>();
    component.submitted.subscribe(submitted);
    fixture.detectChanges();

    component.form.controls.name.setValue('a'.repeat(81));
    component.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
  });

  it('should disable the submit button while submitting', () => {
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const submitButton = getSubmitButton();

    expect(submitButton.disabled).toBe(true);
    expect(submitButton.getAttribute('aria-busy')).toBe('true');
    expect(submitButton.textContent).toContain('Carregando');
  });

  function getFormElement(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function getInputElement(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }
});
