import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalUserSelector } from './local-user-selector';

describe('LocalUserSelector', () => {
  let component: LocalUserSelector;
  let fixture: ComponentFixture<LocalUserSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalUserSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalUserSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
