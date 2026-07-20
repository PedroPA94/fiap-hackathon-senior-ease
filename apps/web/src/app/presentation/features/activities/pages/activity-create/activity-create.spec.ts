import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityCreate } from './activity-create';

describe('ActivityCreate', () => {
  let fixture: ComponentFixture<ActivityCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActivityCreate] }).compileComponents();
    fixture = TestBed.createComponent(ActivityCreate);
    fixture.detectChanges();
  });

  it('renders an accessible provisional page without mock activity data', () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Nova atividade');
    expect(fixture.nativeElement.textContent).toContain('será implementado na próxima etapa');
    expect(fixture.nativeElement.querySelectorAll('se-activity-list-item')).toHaveLength(0);
  });
});
