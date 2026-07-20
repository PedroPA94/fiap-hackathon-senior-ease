import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'se-activity-details',
  templateUrl: './activity-details.html',
  styleUrl: '../activity-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetails {}
