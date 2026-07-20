import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { ActivityDetails } from './activity-details';

describe('ActivityDetails', () => {
  let fixture: ComponentFixture<ActivityDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ activityId: 'created-activity' }) },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityDetails);
    fixture.detectChanges();
  });

  it('reads a real route parameter and renders the provisional page without mock data', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(
      (fixture.componentInstance as unknown as { activityId: string | null }).activityId,
    ).toBe('created-activity');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Detalhes da atividade',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Os detalhes e as etapas desta atividade serão exibidos aqui.',
    );
    expect(fixture.nativeElement.querySelectorAll('se-activity-list-item')).toHaveLength(0);
  });
});
