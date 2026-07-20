import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityDetails } from './activity-details';

describe('ActivityDetails', () => {
  let fixture: ComponentFixture<ActivityDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActivityDetails] }).compileComponents();
    fixture = TestBed.createComponent(ActivityDetails);
    fixture.detectChanges();
  });

  it('renders an accessible provisional page without mock activity data', () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Detalhes da atividade',
    );
    expect(fixture.nativeElement.textContent).toContain('será implementado na próxima etapa');
    expect(fixture.nativeElement.querySelectorAll('se-activity-list-item')).toHaveLength(0);
  });
});
