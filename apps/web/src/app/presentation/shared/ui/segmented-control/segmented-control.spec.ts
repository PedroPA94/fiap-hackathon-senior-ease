import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentedControl } from './segmented-control';

describe('SegmentedControl', () => {
  let component: SegmentedControl;
  let fixture: ComponentFixture<SegmentedControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControl],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should render the label and options', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Tamanho da fonte');
    expect(fixture.nativeElement.textContent).toContain('Normal');
    expect(fixture.nativeElement.textContent).toContain('Grande');
  });

  it('should disable all options through ControlValueAccessor', () => {
    createComponent();

    component.setDisabledState(true);
    fixture.detectChanges();

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    );
    expect(inputs.every((input) => input.disabled)).toBe(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SegmentedControl);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('controlId', 'font-size');
    fixture.componentRef.setInput('label', 'Tamanho da fonte');
    fixture.componentRef.setInput('options', [
      { value: 'normal', label: 'Normal' },
      { value: 'large', label: 'Grande' },
    ]);
    fixture.detectChanges();
  }
});
