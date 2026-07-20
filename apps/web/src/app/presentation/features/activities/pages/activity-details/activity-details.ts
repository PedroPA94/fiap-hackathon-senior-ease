import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'se-activity-details',
  templateUrl: './activity-details.html',
  styleUrl: '../activity-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetails {
  private readonly route = inject(ActivatedRoute);

  protected readonly activityId = this.route.snapshot.paramMap.get('activityId');
}
